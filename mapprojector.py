import tkinter as tk
from tkinter import filedialog, messagebox, Listbox, simpledialog
import cv2 as cv
import numpy as np
import json
import os

drawing = False
erasing = False
ix, iy = -1, -1
original = []
settings = {}

def reveal_region(event, x, y, flags, param):
    global drawing, erasing, ix, iy, original, dm_map, intermediate, overlay, alpha

    if event == cv.EVENT_LBUTTONDOWN:
        drawing = True
        ix, iy = x, y
        intermediate = dm_map.copy()
        # dm_map = original.copy()
        overlay = intermediate.copy()
        cv.rectangle(overlay, (x,y), (x,y), (0,255,0), -1, lineType=cv.LINE_8)
        cv.addWeighted(overlay, alpha, dm_map, 1-alpha, 0, dm_map)

    elif event == cv.EVENT_MOUSEMOVE:
        if drawing:
            dm_map = intermediate.copy()
            overlay = intermediate.copy()
            cv.rectangle(overlay, (ix,iy), (x,y), (0,255,0), -1)
            cv.addWeighted(overlay, alpha, dm_map, 1-alpha, 0, dm_map)
            # x,y,w,h = cv.selectROIs("image", i, False, False)
            # cv.imshow("test", img[y:y+h, x:x+w])
        elif erasing:
            dm_map = intermediate.copy()
            cv.rectangle(dm_map, (ix,iy), (x,y), (0,0,255), thickness = 3)
    
    elif event == cv.EVENT_LBUTTONUP:
        dm_map = intermediate.copy()
        # dm_map = cv.rectangle(dm_map, (ix,iy), (x,y), (0,255,0), lineType=cv.LINE_8)
        cv.rectangle(overlay, (ix,iy), (x,y), (0,255,0), lineType=cv.LINE_8)
        cv.addWeighted(overlay, alpha, dm_map, 1-alpha, 0, dm_map)
        if x < 0:
            x=0
        if y < 0:
            y = 0
        if x > dm_map.shape[1]:
            x = dm_map.shape[1]
        if y > dm_map.shape[0]:
            y = dm_map.shape[0]
        if iy < y and ix < x:
            player_map[iy:y,ix:x] = original.copy()[iy:y, ix:x]
        elif iy < y and ix > x:
            player_map[iy:y, x:ix] = original.copy()[iy:y, x:ix]
        elif iy > y and ix < x:
            player_map[y:iy, ix:x] = original.copy()[y:iy, ix:x]
        elif iy > y and ix > x:
            player_map[y:iy, x:ix] = original.copy()[y:iy, x:ix]
        # cv.imshow("Player Map", addition)
        intermediate = dm_map.copy()
        drawing = False

    elif event == cv.EVENT_RBUTTONDOWN:
        erasing = True
        ix, iy = x, y
        dm_map = intermediate.copy()
        cv.rectangle(dm_map, (x,y), (x,y), (0,0,255), thickness = 3, lineType=cv.LINE_8)
    
    elif event == cv.EVENT_RBUTTONUP:
        dm_map = intermediate.copy()
        # cv.rectangle(dm_map, (ix,iy), (x,y), (0,0,255), thickness = 3, lineType=cv.LINE_8)
        if x < 0:
            x=0
        if y < 0:
            y = 0
        if x > dm_map.shape[1]:
            x = dm_map.shape[1]
        if y > dm_map.shape[0]:
            y = dm_map.shape[0]
        
        if iy < y and ix < x:
            player_map[iy:y,ix:x] = np.zeros((abs(iy-y), abs(ix-x), 3), np.uint8)
            dm_map[iy:y,ix:x] = original.copy()[iy:y, ix:x]
        elif iy < y and ix > x:
            player_map[iy:y, x:ix] = np.zeros((abs(iy-y), abs(ix-x), 3), np.uint8)
            dm_map[iy:y, x:ix] = original.copy()[iy:y, x:ix]
        elif iy > y and ix < x:
            player_map[y:iy, ix:x] = np.zeros((abs(iy-y), abs(ix-x), 3), np.uint8)
            dm_map[y:iy, ix:x] = original.copy()[y:iy, ix:x]
        elif iy > y and ix > x:
            player_map[y:iy, x:ix] = np.zeros((abs(iy-y), abs(ix-x), 3), np.uint8)
            dm_map[y:iy, x:ix] = original.copy()[y:iy, x:ix]
        # cv.imshow("Player Map", addition)
        intermediate = dm_map.copy()
        erasing = False


def save(save_name):
    global settings, dm_map, player_map, alpha, original
    save_path = os.path.join('./saves', save_name)
    if not os.path.exists(save_path):
        os.makedirs(save_path)
    cv.imwrite(os.path.join(save_path,"dm_map.jpg"), dm_map)
    cv.imwrite(os.path.join(save_path,"player_map.jpg"), player_map)
    cv.imwrite(os.path.join(save_path,"original.jpg"), original)
    saveinfo = {}
    saveinfo['alpha'] = alpha
    settings['saves'][save_name] = saveinfo

def load(event):
    global settings, dm_map, player_map, alpha, root, original, intermediate, overlay
    root.withdraw()
    save_name = event.widget.get(event.widget.curselection())
    save_path = os.path.join('./saves', save_name)
    saveinfo = settings['saves'][save_name]
    alpha = saveinfo['alpha']
    original = cv.imread(os.path.join(save_path,"original.jpg"))
    dm_map = cv.imread(os.path.join(save_path,"dm_map.jpg"))
    intermediate = dm_map.copy()
    overlay = dm_map.copy()
    player_map = cv.imread(os.path.join(save_path,"player_map.jpg"))
    run()

def run():
    global dm_map, player_map, original, alpha, settings, intermediate
    cv.namedWindow('Dungeon Master Map')
    cv.setMouseCallback('Dungeon Master Map', reveal_region)
    running = True
    while running:
        cv.imshow('Dungeon Master Map', dm_map)
        cv.imshow("Player Map", player_map)
        k = cv.waitKeyEx(10) & 0xEFFFFF
        if k == 27 or cv.getWindowProperty('Dungeon Master Map', 1) < 1:
            save_answer = messagebox.askyesnocancel("Save?", "Would you like to save before exiting?")
            if save_answer is None:
                pass
            if save_answer:
                save_name = simpledialog.askstring("Save File As...", "What do you want to call this save file?")
                save(save_name)
                running = False
            else:
                running = False
        elif k == 2490368:
            if alpha <= 0.9:
                alpha += 0.1
        elif k == 2621440:
            if alpha >= 0.2:
                alpha -= 0.1
    with open('settings.json', 'w') as f:
        json.dump(settings, f)
    cv.destroyAllWindows()
    root.destroy()

if __name__ == "__main__":
    root = tk.Tk()
    root.withdraw()
    if not os.path.exists("saves"):
        os.makedirs("saves")
    try:
        with open('settings.json') as f:
            settings = json.load(f)
    except FileNotFoundError:
            settings = {"defaults":
                           { "initial_dir": "~",
                             "alpha": 0.15},
                        "saves": {}
            }
    initial_dir = settings['defaults']['initial_dir']
    alpha = settings['defaults']['alpha']
    existing_map = messagebox.askyesno("Open Existing Map?", "Would you like to open an existing map?")
    if not existing_map:
        root.filename = filedialog.askopenfilename(initialdir=initial_dir,
            title="Select Map Image",
            filetypes=(('Jpeg', '*.jpg'),
                    ("PNG", "*.png"),
                    ("PDF", "*.pdf"),
                    ("All Files", "*.*") ))

        file_path = os.path.split(root.filename)
        settings['defaults']['initial_dir'] = os.path.join(*file_path[:-1])
        original = cv.imread(root.filename)
        intermediate = original.copy()
        overlay = original.copy()
        dm_map = original.copy()
        player_map = np.zeros((original.shape[0], original.shape[1], 3), np.uint8)
        
        alpha = 0.15
        run()
    
    else:
        listbox= Listbox()
        i=1
        for savename in settings['saves']:
            listbox.insert(i, savename)
            i += 1
        listbox.pack()
        listbox.bind("<Double-Button-1>", load)
        root.deiconify()
        root.mainloop()