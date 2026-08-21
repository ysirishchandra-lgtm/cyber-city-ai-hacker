import os
import math

def create_obj(filepath, vertices, faces, mtl_name=None):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w') as f:
        f.write("# SCAR 3D Model Procedural Asset\n")
        if mtl_name:
            f.write(f"mtllib {mtl_name}.mtl\n")
            f.write(f"usemtl {mtl_name}\n")
        for v in vertices:
            f.write(f"v {v[0]:.4f} {v[1]:.4f} {v[2]:.4f}\n")
        for face in faces:
            f.write("f " + " ".join(str(idx + 1) for idx in face) + "\n")

# 1. Volt Protagonist Humanoid
def generate_volt():
    vertices = []
    faces = []
    
    def add_box(cx, cy, cz, sx, sy, sz):
        base = len(vertices)
        hx, hy, hz = sx/2, sy/2, sz/2
        corners = [
            (cx-hx, cy-hy, cz-hz), (cx+hx, cy-hy, cz-hz),
            (cx+hx, cy+hy, cz-hz), (cx-hx, cy+hy, cz-hz),
            (cx-hx, cy-hy, cz+hz), (cx+hx, cy-hy, cz+hz),
            (cx+hx, cy+hy, cz+hz), (cx-hx, cy+hy, cz+hz)
        ]
        vertices.extend(corners)
        box_faces = [
            (base+0, base+1, base+2, base+3), # Front
            (base+5, base+4, base+7, base+6), # Back
            (base+4, base+0, base+3, base+7), # Left
            (base+1, base+5, base+6, base+2), # Right
            (base+3, base+2, base+6, base+7), # Top
            (base+4, base+5, base+1, base+0)  # Bottom
        ]
        faces.extend(box_faces)

    # Torso
    add_box(0, 1.2, 0, 0.45, 0.6, 0.25)
    # Head & Visor
    add_box(0, 1.65, 0, 0.22, 0.25, 0.22)
    add_box(0, 1.65, 0.12, 0.24, 0.08, 0.05) # Visor
    # Legs
    add_box(-0.12, 0.5, 0, 0.16, 0.9, 0.18)
    add_box(0.12, 0.5, 0, 0.16, 0.9, 0.18)
    # Arms
    add_box(-0.32, 1.15, 0, 0.14, 0.7, 0.14)
    add_box(0.32, 1.15, 0, 0.14, 0.7, 0.14)
    # Trenchcoat Back
    add_box(0, 0.8, -0.12, 0.52, 0.85, 0.06)
    # Energized Katana
    add_box(0.35, 1.1, 0.4, 0.04, 0.04, 1.1)

    return vertices, faces

# 2. Combat Drone
def generate_drone():
    vertices = []
    faces = []
    
    def add_box(cx, cy, cz, sx, sy, sz):
        base = len(vertices)
        hx, hy, hz = sx/2, sy/2, sz/2
        corners = [
            (cx-hx, cy-hy, cz-hz), (cx+hx, cy-hy, cz-hz),
            (cx+hx, cy+hy, cz-hz), (cx-hx, cy+hy, cz-hz),
            (cx-hx, cy-hy, cz+hz), (cx+hx, cy-hy, cz+hz),
            (cx+hx, cy+hy, cz+hz), (cx-hx, cy+hy, cz+hz)
        ]
        vertices.extend(corners)
        box_faces = [
            (base+0, base+1, base+2, base+3),
            (base+5, base+4, base+7, base+6),
            (base+4, base+0, base+3, base+7),
            (base+1, base+5, base+6, base+2),
            (base+3, base+2, base+6, base+7),
            (base+4, base+5, base+1, base+0)
        ]
        faces.extend(box_faces)

    # Core
    add_box(0, 0, 0, 0.5, 0.25, 0.5)
    # Sensor Eye
    add_box(0, 0, 0.28, 0.18, 0.12, 0.08)
    # 4 Rotor Arms
    add_box(0.4, 0.05, 0.4, 0.12, 0.04, 0.12)
    add_box(-0.4, 0.05, 0.4, 0.12, 0.04, 0.12)
    add_box(0.4, 0.05, -0.4, 0.12, 0.04, 0.12)
    add_box(-0.4, 0.05, -0.4, 0.12, 0.04, 0.12)

    return vertices, faces

# 3. Sentinel Walker
def generate_sentinel():
    vertices = []
    faces = []
    
    def add_box(cx, cy, cz, sx, sy, sz):
        base = len(vertices)
        hx, hy, hz = sx/2, sy/2, sz/2
        corners = [
            (cx-hx, cy-hy, cz-hz), (cx+hx, cy-hy, cz-hz),
            (cx+hx, cy+hy, cz-hz), (cx-hx, cy+hy, cz-hz),
            (cx-hx, cy-hy, cz+hz), (cx+hx, cy-hy, cz+hz),
            (cx+hx, cy+hy, cz+hz), (cx-hx, cy+hy, cz+hz)
        ]
        vertices.extend(corners)
        box_faces = [
            (base+0, base+1, base+2, base+3),
            (base+5, base+4, base+7, base+6),
            (base+4, base+0, base+3, base+7),
            (base+1, base+5, base+6, base+2),
            (base+3, base+2, base+6, base+7),
            (base+4, base+5, base+1, base+0)
        ]
        faces.extend(box_faces)

    # Heavy Cockpit Chassis
    add_box(0, 2.2, 0, 1.4, 1.1, 1.6)
    # Red Optical Sensor
    add_box(0, 2.2, 0.85, 0.6, 0.25, 0.15)
    # Twin Gatlings
    add_box(-0.9, 2.0, 0.7, 0.22, 0.22, 1.4)
    add_box(0.9, 2.0, 0.7, 0.22, 0.22, 1.4)
    # Hydraulic Legs
    add_box(-0.7, 0.9, 0, 0.35, 1.8, 0.45)
    add_box(0.7, 0.9, 0, 0.35, 1.8, 0.45)

    return vertices, faces

# 4. Atlas Prodigy Boss
def generate_atlas():
    vertices = []
    faces = []
    
    def add_box(cx, cy, cz, sx, sy, sz):
        base = len(vertices)
        hx, hy, hz = sx/2, sy/2, sz/2
        corners = [
            (cx-hx, cy-hy, cz-hz), (cx+hx, cy-hy, cz-hz),
            (cx+hx, cy+hy, cz-hz), (cx-hx, cy+hy, cz-hz),
            (cx-hx, cy-hy, cz+hz), (cx+hx, cy-hy, cz+hz),
            (cx+hx, cy+hy, cz+hz), (cx-hx, cy+hy, cz+hz)
        ]
        vertices.extend(corners)
        box_faces = [
            (base+0, base+1, base+2, base+3),
            (base+5, base+4, base+7, base+6),
            (base+4, base+0, base+3, base+7),
            (base+1, base+5, base+6, base+2),
            (base+3, base+2, base+6, base+7),
            (base+4, base+5, base+1, base+0)
        ]
        faces.extend(box_faces)

    # Regal Armored Torso
    add_box(0, 1.3, 0, 0.55, 0.7, 0.3)
    # Head & Crown
    add_box(0, 1.8, 0, 0.24, 0.26, 0.24)
    add_box(0, 1.95, 0, 0.28, 0.08, 0.28) # Halo Crown
    # Flowing Cape
    add_box(0, 0.9, -0.18, 0.75, 1.2, 0.05)
    # Arms
    add_box(-0.4, 1.25, 0, 0.16, 0.75, 0.16)
    add_box(0.4, 1.25, 0, 0.16, 0.75, 0.16)
    # Legs (Hovering pose)
    add_box(-0.15, 0.45, 0, 0.18, 0.95, 0.2)
    add_box(0.15, 0.45, 0, 0.18, 0.95, 0.2)

    return vertices, faces

if __name__ == "__main__":
    base_dirs = [
        "Assets/Models/Characters",
        "Assets/Models/Enemies",
        "C:/Users/durga/OneDrive/Desktop/GameHack/Game/Assets/Models/Characters",
        "C:/Users/durga/OneDrive/Desktop/GameHack/Game/Assets/Models/Enemies"
    ]
    
    v1, f1 = generate_volt()
    create_obj("Assets/Models/Characters/Volt_Protagonist.obj", v1, f1, "Volt_Mat")
    create_obj("C:/Users/durga/OneDrive/Desktop/GameHack/Game/Assets/Models/Characters/Volt_Protagonist.obj", v1, f1, "Volt_Mat")

    v2, f2 = generate_atlas()
    create_obj("Assets/Models/Characters/Atlas_Boss.obj", v2, f2, "Atlas_Mat")
    create_obj("C:/Users/durga/OneDrive/Desktop/GameHack/Game/Assets/Models/Characters/Atlas_Boss.obj", v2, f2, "Atlas_Mat")

    v3, f3 = generate_drone()
    create_obj("Assets/Models/Enemies/Combat_Drone.obj", v3, f3, "Drone_Mat")
    create_obj("C:/Users/durga/OneDrive/Desktop/GameHack/Game/Assets/Models/Enemies/Combat_Drone.obj", v3, f3, "Drone_Mat")

    v4, f4 = generate_sentinel()
    create_obj("Assets/Models/Enemies/Sentinel_Walker.obj", v4, f4, "Sentinel_Mat")
    create_obj("C:/Users/durga/OneDrive/Desktop/GameHack/Game/Assets/Models/Enemies/Sentinel_Walker.obj", v4, f4, "Sentinel_Mat")

    print("[SUCCESS] All 3D OBJ Models Generated Successfully!")
