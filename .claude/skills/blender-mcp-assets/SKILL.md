---
name: blender-mcp-assets
description: Use this skill whenever the user wants to find, download, or import ready-made 3D assets, HDRIs, textures, or AI-generated models into Blender through an active Blender MCP connection (ahujasid/blender-mcp) — sourcing from Poly Haven (HDRIs/textures), Sketchfab (pre-made models), or generating new models from a text description or reference image via Hyper3D Rodin or Hunyuan3D. Trigger this whenever the user describes wanting a specific real-world object, environment lighting, or texture rather than hand-built procedural geometry (e.g. "find me a sunset beach HDRI", "get a low-poly tree model from Sketchfab", "generate a garden gnome from this photo", "give the ground a rock texture").
---

# Assets 3D y generación IA en Blender vía MCP

Este skill cubre cómo traer contenido 3D ya existente (o generado por IA) a la escena,
en lugar de modelarlo a mano con `bpy`. El servidor MCP de `ahujasid/blender-mcp` integra
cuatro fuentes distintas, cada una con su propio set de herramientas. Elegí la fuente
según lo que pida el usuario — no repliques con código procedural (skill
`blender-mcp-modeling`) algo que ya existe como asset descargable.

## Antes de empezar: verificar que la integración esté habilitada

Estas integraciones son opcionales y dependen de configuración (API keys) en el addon de
Blender del usuario. No asumas que están disponibles — confirmalo primero con el status
tool correspondiente, y si viene deshabilitada, avisale al usuario en vez de fallar a
mitad de camino:

- `get_polyhaven_status`
- `get_sketchfab_status`
- `get_hyper3d_status`
- `get_hunyuan3d_status`

## Poly Haven — HDRIs, texturas y materiales fotorrealistas

Usalo para iluminación de ambiente (HDRIs) o texturas realistas de superficies (madera,
piedra, tela, etc.).

1. `get_polyhaven_categories(asset_type)` — ver qué categorías existen para el tipo de
   asset (`hdris`, `textures`, `models`).
2. `search_polyhaven_assets(asset_type, categories)` — buscar candidatos dentro de esas
   categorías.
3. `download_polyhaven_asset(asset_id, asset_type, resolution, file_format)` — descargar
   e importar. Elegí una resolución razonable para el uso (previews/iteración rápida en
   baja resolución; solo subí a 4K+ si el usuario pidió calidad final de render).
4. `set_texture(object_name, texture_id)` — aplicar una textura ya descargada a un objeto
   puntual de la escena.

## Sketchfab — modelos pre-hechos

Usalo cuando el usuario quiere un objeto concreto ya modelado (un mueble, un personaje,
un vehículo) en vez de construirlo desde cero.

1. `search_sketchfab_models(query, categories, count, downloadable=True)` — filtrar por
   `downloadable=True` es importante: sin eso, la búsqueda puede devolver modelos que no
   se pueden bajar, y vas a llegar al paso de descarga para descubrir que no se puede.
2. `get_sketchfab_model_preview(uid)` — pedí una preview antes de descargar cuando haya
   ambigüedad entre varios resultados parecidos, para confirmar visualmente cuál es el
   correcto antes de gastar la descarga.
3. `download_sketchfab_model(uid, target_size)` — descarga e importa el modelo, escalado
   al tamaño indicado.

Nota de licencias: los modelos de Sketchfab tienen licencias variadas (algunas requieren
atribución, otras prohíben uso comercial). Si el contexto de uso del usuario es comercial
o de distribución, mencioná que conviene revisar la licencia del modelo específico antes
de usarlo — no asumas que todo lo descargable es de uso libre.

## Hyper3D Rodin / Hunyuan3D — generación de modelos por IA

Usalo cuando no existe un asset pre-hecho adecuado y el usuario quiere generar un modelo
nuevo a partir de una descripción de texto o una imagen de referencia.

**Hyper3D Rodin:**
1. `generate_hyper3d_model_via_text(text_prompt, bbox_condition)` o
   `generate_hyper3d_model_via_images(input_image_paths / input_image_urls, bbox_condition)`
   — dispara el job de generación.
2. `poll_rodin_job_status(subscription_key, request_id)` — la generación es asíncrona y
   puede tardar; consultá el estado periódicamente en vez de asumir que terminó
   inmediatamente, y avisale al usuario que el modelo se está generando.
3. `import_generated_asset(name, task_uuid, request_id)` — una vez listo, importarlo a la
   escena.

**Hunyuan3D:**
1. `generate_hunyuan3d_model(text_prompt, input_image_url)` — dispara el job.
2. `poll_hunyuan_job_status(job_id)` — igual que arriba, consultar hasta que complete.
3. `import_generated_asset_hunyuan(name, zip_file_url)` — importar el resultado.

Si el usuario no especifica cuál motor de generación usar y ambos están habilitados,
Hyper3D Rodin suele dar mejor fidelidad geométrica para objetos "duros" (props,
vehículos, mobiliario); preguntale solo si la elección realmente importa para su caso,
si no, elegí uno y avisale cuál usaste.

## Después de importar

Una vez que el asset está en la escena (venga de Poly Haven, Sketchfab o generación IA),
cualquier ajuste posterior — reposicionar, escalar, aplicar modificadores, integrar
materiales con el resto de la escena — es trabajo del skill `blender-mcp-modeling`, no de
este.
