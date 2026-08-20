# Huemul VR 3D — video estéreo side-by-side

Escena 3D de un huemul (*Hippocamelus bisulcus*) en bosque andino,
renderizada como video estereoscópico para gafas VR tipo Cardboard
con celular Android.

## Specs de render estéreo

| Parámetro | Valor |
|---|---|
| Formato | Side-by-Side (SBS) |
| Resolución | 3840x1080 (1920x1080 por ojo) |
| Codec | H.264 / MP4 |
| Blender | Render > Stereoscopy > Stereo 3D, modo "Side-by-Side" |
| Interocular distance | ~0.065 m (6.5 cm) |
| Cámara | Constraint `TRACK_TO` apuntando al huemul (no `rotation_euler` fija) |

## Decisiones de estilo

- **Huemul**: realista, generado con IA vía Hyper3D Rodin. No low-poly,
  no reusar la cabeza de la máscara papercraft de otro proyecto.
- **Ambiente**: bosque andino detallado — varias capas, rocas, vegetación.
  No una escena simple.

## Plan de trabajo

1. `get_scene_info` — estado actual de la escena en Blender.
2. `get_hyper3d_status` + `get_polyhaven_status` — confirmar que ambas
   integraciones estén habilitadas en el addon.
3. Generar el huemul con Hyper3D Rodin (texto o imagen de referencia).
4. Terreno base + HDRI de bosque/montaña andino desde Poly Haven
   (iluminación ambiente y fondo).
5. Capas de vegetación: pastizales, rocas, ñirre/lenga
   (texturas de Poly Haven + modelos puntuales de Sketchfab si hace falta).
6. Posicionar el huemul, ajustar escala, integrar materiales.
7. Cámara estéreo side-by-side apuntando a la escena.

## Referencia visual

Existe un modelo de cabeza de huemul low-poly texturizado (máscara
papercraft, proyecto separado) en:

```
C:\Users\llane\OneDrive\Desktop\javier\lender\low poly deer 3d model
```

No se usa como base geométrica, pero sirve como referencia visual si
Hyper3D necesita una imagen de entrada.

## Conexión Blender MCP

El addon usado es [ahujasid/blender-mcp](https://github.com/ahujasid/blender-mcp).

Requisitos antes de empezar, **en la máquina local**:

1. Blender abierto con el addon activo.
2. Servidor iniciado: panel `N` > BlenderMCP > Start Server.
3. Servidor registrado en Claude Code:
   ```
   claude mcp add blender -- uvx blender-mcp
   ```
4. Verificar con `/mcp` que "blender" figure como conectado.

> **Importante:** las herramientas de Blender MCP solo funcionan en una
> sesión de Claude Code corriendo en la misma máquina que Blender. Una
> sesión remota (Claude Code on the web) corre en un contenedor aislado
> en la nube y no puede alcanzar el servidor MCP local.
