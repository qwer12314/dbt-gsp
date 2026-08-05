---
name: blender-mcp-modeling
description: Use this skill whenever the user wants to model, build, edit, or manipulate 3D objects and scenes in Blender through an active Blender MCP connection (ahujasid/blender-mcp) — creating meshes, applying transforms and modifiers, setting up materials/shaders, lighting, or cameras, inspecting scene state, or running Python code inside Blender. Trigger this even when the user just describes a 3D object or scene without saying "Blender" or "MCP" explicitly (e.g. "make me a red metallic car", "add a low-poly forest", "build a simple room with a table and chair", "make that cube twice as big and move it up"), as long as a Blender MCP connection is available.
---

# Modelado 3D en Blender vía MCP

Este skill cubre el flujo de trabajo para crear y editar geometría, materiales, luces y
cámaras en Blender a través del servidor MCP de `ahujasid/blender-mcp`. Ese servidor no
expone comandos de modelado de alto nivel (no hay un tool `create_cube` o `add_material`);
en cambio, expone un puente genérico a la API de Python de Blender (`bpy`). Todo el trabajo
de modelado se hace escribiendo código Python y ejecutándolo con `execute_blender_code`.

## Herramientas disponibles

- `get_scene_info` — devuelve el estado actual de la escena (objetos existentes, nombres,
  jerarquía). Úsalo antes de modelar para saber con qué estás trabajando.
- `get_object_info(object_name)` — detalle de un objeto puntual (transform, mesh data,
  modificadores, materiales asignados).
- `execute_blender_code(code)` — corre Python arbitrario dentro de Blender. Este es el
  motor real del skill: todo (crear, transformar, materiales, modificadores, luces,
  cámaras, joins, parenting) pasa por aquí como `bpy` code.
- `get_viewport_screenshot` — captura el viewport como imagen. Es tu forma de "ver" el
  resultado, ya que no tenés ojos sobre la escena real.

## Bucle de trabajo recomendado

1. **Inspeccionar antes de actuar.** Llamá `get_scene_info` (y `get_object_info` si el
   pedido menciona un objeto existente) antes de escribir código. Modelar a ciegas sobre
   una escena que no conocés produce nombres duplicados, objetos superpuestos o ediciones
   sobre el objeto equivocado.
2. **Escribir Python en bloques con sentido, no en fragmentos mínimos.** Cada llamada a
   `execute_blender_code` debería completar un paso lógico completo (por ejemplo: "crear
   la mesa con sus 4 patas y asignarle material de madera"), no una sola línea. Esto reduce
   idas y vueltas y evita quedar a mitad de una operación si algo falla.
3. **Nombrar todo lo que creás.** Asigná `obj.name = "algo_descriptivo"` a cada objeto
   nuevo. Sin esto, Blender los deja como `Cube.001`, `Cube.002`, etc., y referenciarlos
   después (con `get_object_info` o en código futuro) se vuelve adivinanza.
4. **Verificar visualmente en pedidos creativos o ambiguos.** Cuando el pedido depende del
   aspecto ("que se vea acogedor", "estilo low-poly", "que combine con...") pedí un
   `get_viewport_screenshot` después de cada cambio significativo antes de seguir
   iterando. Para pedidos puramente mecánicos ("mové el cubo 2 unidades en X") no hace
   falta pausar a mirar cada vez.
5. **Manejar errores de forma visible.** El código corre dentro del proceso de Blender;
   si falla, preferís enterarte a que la operación desaparezca en silencio. Envolvé
   operaciones riesgosas en `try/except` e imprimí (`print(...)`) un mensaje claro del
   error — así se refleja en la respuesta de `execute_blender_code` y podés corregir en el
   siguiente paso en lugar de asumir que algo se aplicó cuando no fue así.

## Patrones de código útiles

**Crear un primitivo y nombrarlo:**
```python
import bpy
bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 1))
obj = bpy.context.active_object
obj.name = "mesa_base"
```

**Transformar un objeto existente (ubicarlo primero por nombre):**
```python
import bpy
obj = bpy.data.objects.get("mesa_base")
if obj is None:
    print("ERROR: no existe un objeto llamado 'mesa_base'")
else:
    obj.location.z += 1
    obj.scale = (1.5, 1.5, 1.5)
```

**Agregar un modificador (bevel, subsurf, etc.):**
```python
import bpy
obj = bpy.data.objects["mesa_base"]
mod = obj.modifiers.new(name="Bevel", type='BEVEL')
mod.width = 0.02
mod.segments = 3
```

**Material simple vía Principled BSDF (color + metalness/roughness):**

Cuidado con `mat.use_nodes = True`: en Blender 5.x ya emite `DeprecationWarning` y está
anunciado para eliminarse en 6.0, porque los materiales nuevos ya vienen con árbol de
nodos. Preguntá por `node_tree` y solo activá `use_nodes` si realmente falta — así el
mismo código sirve en 4.x (donde hace falta) y en 5.x+ (donde ya no).

```python
import bpy
mat = bpy.data.materials.new(name="rojo_metalico")
if mat.node_tree is None:          # Blender 4.x lo necesita; 5.x+ ya trae nodos
    mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.8, 0.05, 0.05, 1.0)
bsdf.inputs["Metallic"].default_value = 0.9
bsdf.inputs["Roughness"].default_value = 0.2

obj = bpy.data.objects["carroceria"]
obj.data.materials.append(mat)
```

**Luz y cámara básicas para poder renderizar/capturar la escena:**
```python
import bpy
light_data = bpy.data.lights.new(name="luz_key", type='SUN')
light_data.energy = 3.0
light_obj = bpy.data.objects.new(name="luz_key", object_data=light_data)
bpy.context.collection.objects.link(light_obj)
light_obj.location = (4, -4, 6)
light_obj.rotation_euler = (0.9, 0, 0.8)

bpy.ops.object.camera_add(location=(6, -6, 4), rotation=(1.1, 0, 0.8))
bpy.context.scene.camera = bpy.context.active_object
```

**Apuntar una cámara o luz hacia un objeto (en vez de adivinar la rotación):**

Fijar `rotation_euler` a mano obliga a calcular ángulos que dependen de dónde quedó el
objeto, y cualquier cambio posterior de posición desencuadra la toma en silencio. Una
constraint `TRACK_TO` hace que "apuntar al objeto" sea una garantía estructural: la cámara
sigue al target aunque después lo muevas o lo reemplaces.

```python
import bpy
cam = bpy.data.objects["camara_principal"]
target = bpy.data.objects["silla"]

c = cam.constraints.new(type='TRACK_TO')
c.target = target
c.track_axis = 'TRACK_NEGATIVE_Z'   # la cámara mira por su -Z
c.up_axis = 'UP_Y'
bpy.context.scene.camera = cam
```

Si preferís no dejar una constraint viva en la escena (por ejemplo para exportar), el
equivalente calculado en el momento es `to_track_quat`:

```python
import bpy, mathutils
cam = bpy.data.objects["camara_principal"]
punto = mathutils.Vector((0, 0, 0.8))       # a dónde querés que mire
cam.rotation_euler = (punto - cam.location).to_track_quat('-Z', 'Y').to_euler()
```

**Unir varios objetos en uno (útil tras armar una pieza compuesta):**
```python
import bpy
objs = [bpy.data.objects["pata_1"], bpy.data.objects["pata_2"],
        bpy.data.objects["pata_3"], bpy.data.objects["pata_4"],
        bpy.data.objects["mesa_base"]]
bpy.context.view_layer.objects.active = objs[-1]
for o in objs:
    o.select_set(True)
bpy.ops.object.join()
bpy.context.active_object.name = "mesa"
```

## Cuándo NO es este skill

Si el pedido es "conseguime un HDRI de playa", "buscá un modelo de árbol ya hecho en
Sketchfab" o "generame un modelo 3D a partir de esta foto", eso es sourcing/generación de
assets externos, no modelado procedural — ver el skill `blender-mcp-assets`. Una vez que el
asset esté importado, este skill vuelve a aplicar para posicionarlo, ajustar materiales o
integrarlo en la escena.
