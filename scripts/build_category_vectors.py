import os
import re
import vtracer
import xml.etree.ElementTree as ET

uploaded_dir = r'C:\Users\Ham\.gemini\antigravity\brain\231326f7-a463-4348-8060-f3090448e921\.user_uploaded'
res_drawable_dir = r'android\app\src\main\res\drawable'

# Downloaded icons map
icons_map = {
    'ic_category_accessories.xml': 'media_1794726778479_7522dada.png',
    'ic_category_shoes.xml': 'media_1794726787410_76745755.png',
    'ic_category_dresses.xml': 'media_1794726787424_6947aa88.png',
    'ic_category_shirts.xml': 'media_1794726787414_922bf42b.png',
    'ic_category_tshirts.xml': 'media_1794726787414_922bf42b.png',
    'ic_category_all.xml': 'media_1794726787417_bb34b65e.png',
    'ic_category_bags.xml': 'media_1794726787430_217cdeb8.png'
}

def transform_path(d, target_size=24.0, margin=1.8):
    tokens = re.findall(r'[A-Za-z]|[-+]?\d*\.?\d+', d)
    points = []
    i = 0
    cur_cmd = None
    coords_idx = []
    
    while i < len(tokens):
        t = tokens[i]
        if t.isalpha():
            cur_cmd = t
            i += 1
        else:
            if cur_cmd in ('M', 'L'):
                coords_idx.append((i, i+1))
                points.append((float(tokens[i]), float(tokens[i+1])))
                i += 2
            elif cur_cmd == 'C':
                coords_idx.append((i, i+1))
                coords_idx.append((i+2, i+3))
                coords_idx.append((i+4, i+5))
                points.extend([(float(tokens[i]), float(tokens[i+1])),
                               (float(tokens[i+2]), float(tokens[i+3])),
                               (float(tokens[i+4]), float(tokens[i+5]))])
                i += 6
            elif cur_cmd == 'Z':
                i += 1
            else:
                i += 1

    if not points:
        return d
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    w = max_x - min_x
    h = max_y - min_y
    if w == 0 or h == 0:
        return d
    
    scale = (target_size - 2 * margin) / max(w, h)
    scaled_w = w * scale
    scaled_h = h * scale
    offset_x = (target_size - scaled_w) / 2.0
    offset_y = (target_size - scaled_h) / 2.0
    
    for ix, iy in coords_idx:
        orig_x = float(tokens[ix])
        orig_y = float(tokens[iy])
        nx = offset_x + (orig_x - min_x) * scale
        ny = offset_y + (orig_y - min_y) * scale
        tokens[ix] = f'{nx:.2f}'
        tokens[iy] = f'{ny:.2f}'
        
    return ' '.join(tokens)

for xml_name, png_name in icons_map.items():
    png_path = os.path.join(uploaded_dir, png_name)
    tmp_svg = os.path.join('scripts', 'tmp_' + xml_name + '.svg')
    vtracer.convert_image_to_svg_py(png_path, tmp_svg)
    
    tree = ET.parse(tmp_svg)
    path_d_list = []
    for el in tree.getroot().iter('{http://www.w3.org/2000/svg}path'):
        fill = el.get('fill', '').lower()
        d = el.get('d', '').strip()
        if fill in ['#000000', 'black', ''] or not fill.startswith('#fff'):
            if d:
                path_d_list.append(d)
                
    combined_d = " ".join(path_d_list)
    normalized_d = transform_path(combined_d, target_size=24.0, margin=1.8)
    
    xml_content = f'''<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="@android:color/white"
        android:pathData="{normalized_d}" />
</vector>
'''
    xml_dest = os.path.join(res_drawable_dir, xml_name)
    with open(xml_dest, 'w', encoding='utf-8') as f:
        f.write(xml_content)
    print(f"Generated normalized 24x24: {xml_name}")
    if os.path.exists(tmp_svg):
        os.remove(tmp_svg)

# Now generate the 3 matching line-art icons in the same 24x24 outline style:

# 1. Pants / Jeans
pants_xml = '''<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="@android:color/white"
        android:pathData="M6.5,2C5.67,2 5,2.67 5,3.5L6.3,21.1C6.38,21.61 6.82,22 7.34,22L10.3,22C10.85,22 11.3,21.55 11.3,21L11.3,12.5C11.3,12.22 11.52,12 11.8,12L12.2,12C12.48,12 12.7,12.22 12.7,12.5L12.7,21C12.7,21.55 13.15,22 13.7,22L16.66,22C17.18,22 17.62,21.61 17.7,21.1L19,3.5C19,2.67 18.33,2 17.5,2L6.5,2ZM6.6,3.6L17.4,3.6L16.25,19.2L16.15,20.4L14.3,20.4L14.3,13.2C14.3,12.1 13.4,11.2 12.3,11.2L11.7,11.2C10.6,11.2 9.7,12.1 9.7,13.2L9.7,20.4L7.85,20.4L7.75,19.2L6.6,3.6ZM9,5.2L15,5.2C15.44,5.2 15.8,5.56 15.8,6C15.8,6.44 15.44,6.8 15,6.8L9,6.8C8.56,6.8 8.2,6.44 8.2,6C8.2,5.56 8.56,5.2 9,5.2ZM11.2,7.8L12.8,7.8L12.8,10.2L11.2,10.2L11.2,7.8Z" />
</vector>
'''
with open(os.path.join(res_drawable_dir, 'ic_category_pants.xml'), 'w', encoding='utf-8') as f:
    f.write(pants_xml)
print("Generated matching line-art: ic_category_pants.xml")

# 2. Jackets / Coats (bomber/biker outline with zip placket and collar)
jackets_xml = '''<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="@android:color/white"
        android:pathData="M8.5,2C7.95,2 7.5,2.45 7.5,3L2.5,6.2C2.19,6.4 2,6.74 2,7.11L3.8,17.2C3.89,17.66 4.29,18 4.76,18L6.4,18C6.95,18 7.4,17.55 7.4,17L6.2,8.8L7.5,8.8L7.5,20.5C7.5,21.33 8.17,22 9,22L15,22C15.83,22 16.5,21.33 16.5,20.5L16.5,8.8L17.8,8.8L16.6,17C16.6,17.55 17.05,18 17.6,18L19.24,18C19.71,18 20.11,17.66 20.2,17.2L22,7.11C22,6.74 21.81,6.4 21.5,6.2L16.5,3C16.5,2.45 16.05,2 15.5,2L8.5,2ZM9,3.6L11.2,3.6L9.6,7.2L9,7.2L9,3.6ZM12.8,3.6L15,3.6L15,7.2L14.4,7.2L12.8,3.6ZM9.1,8.8L11.2,8.8L11.2,20.4L9.1,20.4L9.1,8.8ZM12.8,8.8L14.9,8.8L14.9,20.4L12.8,20.4L12.8,8.8ZM4.9,8.2L6.1,16.4L5.3,16.4L3.84,8.2L4.9,8.2ZM17.9,16.4L19.1,8.2L20.16,8.2L18.7,16.4L17.9,16.4Z" />
</vector>
'''
with open(os.path.join(res_drawable_dir, 'ic_category_jackets.xml'), 'w', encoding='utf-8') as f:
    f.write(jackets_xml)
print("Generated matching line-art: ic_category_jackets.xml")

# 3. Leather (authentic leather hide / emblem craft badge in outline)
leather_xml = '''<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="@android:color/white"
        android:pathData="M12,2C10.6,3.4 9.5,4.1 7.8,3.7C6.8,3.5 5.8,4.1 5.4,5L3.3,9.5C3,10.2 3.2,11 3.8,11.5C4.8,12.3 5.3,13.4 4.8,14.6L3.9,16.8C3.5,17.7 3.8,18.8 4.7,19.3L7.5,21C8.7,21.7 9.8,21.2 10.8,20.4C11.5,19.8 12.5,19.8 13.2,20.4C14.2,21.2 15.3,21.7 16.5,21L19.3,19.3C20.2,18.8 20.5,17.7 20.1,16.8L19.2,14.6C18.7,13.4 19.2,12.3 20.2,11.5C20.8,11 21,10.2 20.7,9.5L18.6,5C18.2,4.1 17.2,3.5 16.2,3.7C14.5,4.1 13.4,3.4 12,2ZM12,4.3C13.2,5.5 14.7,6 16.5,5.4L18.3,9.4C17,10.7 16.4,12.5 17.1,14.2L17.9,16.1L15.6,17.5C14.1,18.4 12.8,18 11.9,17.3C11,16.5 9.7,16.5 8.8,17.3C7.9,18 6.6,18.4 5.1,17.5L6.1,16.1C6.8,14.4 6.2,12.6 4.9,11.3L6.7,7.3C8.5,7.9 10,7.4 11.2,6.2C11.5,5.5 11.7,4.9 12,4.3ZM12,8C10.9,8 10,8.9 10,10C10,11.1 10.9,12 12,12C13.1,12 14,11.1 14,10C14,8.9 13.1,8 12,8ZM12,9.6C12.2,9.6 12.4,9.8 12.4,10C12.4,10.2 12.2,10.4 12,10.4C11.8,10.4 11.6,10.2 11.6,10C11.6,9.8 11.8,9.6 12,9.6Z" />
</vector>
'''
with open(os.path.join(res_drawable_dir, 'ic_category_leather.xml'), 'w', encoding='utf-8') as f:
    f.write(leather_xml)
print("Generated matching line-art: ic_category_leather.xml")

print("All 9 category vector drawables built successfully!")
