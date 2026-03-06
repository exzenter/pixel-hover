# EXZENT Pixel Hover

Pixel-Dissolve Hover-Effekt für Link-Listen in WordPress.  
Kein Build-Step. Kein jQuery. Kein sichtbarer Frontend-Output.

---

## Installation

1. Ordner `exzent-pixel-hover` nach `/wp-content/plugins/` kopieren
2. Plugin aktivieren

## Verwendung

### Im Editor

Block **"Pixel Hover Effect"** in die Seite/in den Template-Part ziehen  
(am besten direkt vor oder nach dem Ziel-Block).

Der Block ist im Frontend **unsichtbar** – er rendert nur eine versteckte Config.  
Das Frontend-Script wird nur geladen wenn der Block auf der Seite vorhanden ist.

---

### Targeting: CSS Selector (Empfohlen)

Gibt einem Parent-Block im Editor einen **HTML-Anker** (Block-Einstellungen → Erweitert → HTML-Anker, z.B. `mein-nav`).

Im Block dann:
- **Modus:** CSS Selector
- **Selector:** `#mein-nav`

→ Alle `<a>` innerhalb des Elements bekommen den Effekt.

Weitere Beispiele:
```
.wp-block-navigation          → alle Links in einem Nav-Block
#leistungen-liste             → HTML-Anker "leistungen-liste"
.meine-link-gruppe a          → gezielter (aber Vorsicht bei Verschachtelung)
```

### Targeting: Link-Klasse

Jedem Link manuell eine CSS-Klasse geben (z.B. per Custom CSS oder Code Snippets),  
dann im Block:
- **Modus:** Link-Klasse
- **Klasse:** `pixel-hover-link` (ohne Punkt)

---

## CSS-Integration

Der Effekt legt **keinen eigenen Stil** für Farben, Padding, Border-Bottom etc. fest.  
Das bleibt vollständig in deinem Theme-CSS.

Einzige Voraussetzung für die Links:
```css
.dein-link {
    position: relative;  /* wird vom Script gesetzt falls static */
    overflow: hidden;    /* wird vom Script gesetzt */
}
```

Die **Pixel-Farbe** (Canvas) wird im Block eingestellt, weil `canvas.fillStyle` nicht per CSS setzbar ist.

Textfarbe beim Hover: Das Script setzt `color: #fff` auf Enter und resettet auf `color: ''` (leer) beim Leave – damit greift deine CSS-Regel wieder. Wenn du die Hover-Textfarbe in CSS hast, reicht das.

---

## Dateien

```
exzent-pixel-hover/
├── exzent-pixel-hover.php   # Plugin-Hauptdatei, Block-Registrierung, Render-Callback
├── block.js                  # Gutenberg Block (no-build, createElement)
├── pixel-hover.js            # Frontend Engine (vanilla JS, footer)
└── editor.css                # Minimale Editor-Stile für den Block-Platzhalter
```

---

## Changelog

**1.0.0**
- Initial release
- CSS Selector + Link-Klassen Targeting
- Pixel-Dissolve mit konfigurierbarer Richtung, Auto-Exit-Winkel, 2×2 Cluster
