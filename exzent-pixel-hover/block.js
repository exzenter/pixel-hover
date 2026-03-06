/**
 * EXZENT Pixel Hover – Gutenberg Block (no-build, plain ES5-ish)
 * Läuft ohne webpack / Babel. Nutzt wp.element.createElement direkt.
 */
(function ( blocks, el, blockEditor, components ) {
    'use strict';

    var InspectorControls = blockEditor.InspectorControls;
    var PanelBody         = components.PanelBody;
    var PanelRow          = components.PanelRow;
    var TextControl       = components.TextControl;
    var RangeControl      = components.RangeControl;
    var SelectControl     = components.SelectControl;
    var ToggleControl     = components.ToggleControl;
    var ColorPicker       = components.ColorPicker;
    var __                = window.wp.i18n.__;

    blocks.registerBlockType( 'exzent/pixel-hover', {
        title:    'Pixel Hover Effect',
        icon:     'art',
        category: 'widgets',
        description: 'Pixel-Dissolve Hover-Effekt auf Link-Listen. Kein sichtbares Output – nur Konfiguration.',
        keywords:    [ 'hover', 'animation', 'pixel', 'exzent' ],

        /* Block attributes – spiegeln die PHP-Definition */
        attributes: {
            targetMode:     { type: 'string',  default: 'selector' },
            targetSelector: { type: 'string',  default: '' },
            targetClass:    { type: 'string',  default: '' },
            pixelColor:     { type: 'string',  default: '#222222' },
            rows:           { type: 'number',  default: 6 },
            exitDuration:   { type: 'number',  default: 380 },
            colorFade:      { type: 'number',  default: 100 },
            randomWeight:   { type: 'number',  default: 45 },
            staggerBase:    { type: 'number',  default: 55 },
            biasAngle:      { type: 'number',  default: 0 },
            autoAngle:      { type: 'boolean', default: false },
            doublePct:      { type: 'number',  default: 0 },
        },

        /* ── EDIT (Backend) ─────────────────────────────────────────────── */
        edit: function ( props ) {
            var attrs = props.attributes;
            var set   = props.setAttributes;

            var isSelectorMode = attrs.targetMode === 'selector';
            var isClassMode    = attrs.targetMode === 'class';

            /* Target-Label fürs Platzhalter-Display */
            var targetLabel = isSelectorMode
                ? ( attrs.targetSelector || '– kein Selector –' )
                : ( attrs.targetClass    ? '.' + attrs.targetClass : '– keine Klasse –' );

            return [

                /* ── Inspector Controls (Sidebar) ── */
                el( InspectorControls, { key: 'inspector' },

                    /* Targeting */
                    el( PanelBody, { title: 'Targeting', initialOpen: true },

                        el( SelectControl, {
                            label:    'Modus',
                            value:    attrs.targetMode,
                            options:  [
                                { label: 'CSS Selector (Parent)', value: 'selector' },
                                { label: 'Link-Klasse',           value: 'class'    },
                            ],
                            onChange: function (v) { set( { targetMode: v } ); },
                        } ),

                        isSelectorMode && el( TextControl, {
                            label:       'CSS Selector',
                            help:        'z.B.  .wp-block-group  oder  #mein-nav  — alle <a> darin bekommen den Effekt.',
                            value:       attrs.targetSelector,
                            onChange:    function (v) { set( { targetSelector: v } ); },
                            placeholder: '.mein-nav-block',
                        } ),

                        isClassMode && el( TextControl, {
                            label:       'Link-Klasse',
                            help:        'Alle <a class="…"> mit dieser Klasse werden erfasst (ohne Punkt).',
                            value:       attrs.targetClass,
                            onChange:    function (v) { set( { targetClass: v } ); },
                            placeholder: 'pixel-hover-link',
                        } ),
                    ),

                    /* Farbe */
                    el( PanelBody, { title: 'Pixel Farbe', initialOpen: false },
                        el( PanelRow, null,
                            el( 'p', { style: { fontSize: '12px', color: '#757575', marginBottom: '8px' } },
                                'Nur für die Canvas-Pixel. Text-Farben bleiben in deinem CSS.'
                            )
                        ),
                        el( ColorPicker, {
                            color:              attrs.pixelColor,
                            onChangeComplete:   function (c) { set( { pixelColor: c.hex } ); },
                            disableAlpha:       true,
                        } ),
                    ),

                    /* Grid */
                    el( PanelBody, { title: 'Grid', initialOpen: false },
                        el( RangeControl, {
                            label:    'Rows',
                            help:     'Anzahl Pixelreihen pro Link. Zellen sind immer quadratisch.',
                            value:    attrs.rows,
                            min:      2,
                            max:      16,
                            step:     1,
                            onChange: function (v) { set( { rows: v } ); },
                        } ),
                    ),

                    /* Animation */
                    el( PanelBody, { title: 'Animation', initialOpen: false },

                        el( RangeControl, {
                            label:    'Exit Duration (ms)',
                            value:    attrs.exitDuration,
                            min:      80,
                            max:      1200,
                            step:     10,
                            onChange: function (v) { set( { exitDuration: v } ); },
                        } ),

                        el( RangeControl, {
                            label:    'Color Fade (%)',
                            help:     'Wie viel % der Exit-Duration die Textfarbe zum Faden braucht.',
                            value:    attrs.colorFade,
                            min:      0,
                            max:      100,
                            step:     5,
                            onChange: function (v) { set( { colorFade: v } ); },
                        } ),

                        el( RangeControl, {
                            label:    'Random Chaos (%)',
                            value:    attrs.randomWeight,
                            min:      0,
                            max:      100,
                            step:     5,
                            onChange: function (v) { set( { randomWeight: v } ); },
                        } ),
                    ),

                    /* Bias Richtung */
                    el( PanelBody, { title: 'Bias Richtung', initialOpen: false },

                        el( RangeControl, {
                            label:    'Stärke (%)',
                            value:    attrs.staggerBase,
                            min:      0,
                            max:      100,
                            step:     5,
                            onChange: function (v) { set( { staggerBase: v } ); },
                        } ),

                        el( ToggleControl, {
                            label:    'Auto Exit-Winkel',
                            help:     attrs.autoAngle
                                ? 'Winkel wird aus der Maus-Austrittsposition berechnet.'
                                : 'Fixer Winkel aus dem Slider unten.',
                            checked:  attrs.autoAngle,
                            onChange: function (v) { set( { autoAngle: v } ); },
                        } ),

                        ! attrs.autoAngle && el( RangeControl, {
                            label:    'Winkel (°)',
                            help:     '0° = rechts→links  ·  90° = unten→oben  ·  180° = links→rechts',
                            value:    attrs.biasAngle,
                            min:      0,
                            max:      359,
                            step:     1,
                            onChange: function (v) { set( { biasAngle: v } ); },
                        } ),
                    ),

                    /* Cluster */
                    el( PanelBody, { title: 'Cluster', initialOpen: false },
                        el( RangeControl, {
                            label:    '2×2 Double Pixel (%)',
                            help:     'Wahrscheinlichkeit, dass 2×2-Blöcke synchron verschwinden.',
                            value:    attrs.doublePct,
                            min:      0,
                            max:      100,
                            step:     5,
                            onChange: function (v) { set( { doublePct: v } ); },
                        } ),
                    ),

                ), /* /InspectorControls */

                /* ── Block-Platzhalter im Editor ── */
                el( 'div', {
                    key:       'placeholder',
                    className: 'exzent-pixel-hover-editor-block',
                },
                    el( 'span', { className: 'exzent-pixel-hover-icon' }, '⬡' ),
                    el( 'span', { className: 'exzent-pixel-hover-title' }, 'Pixel Hover Effect' ),
                    el( 'span', { className: 'exzent-pixel-hover-target' }, targetLabel ),
                ),
            ];
        },

        /* Server-side render → save gibt null zurück */
        save: function () { return null; },
    } );

})( window.wp.blocks, window.wp.element.createElement, window.wp.blockEditor, window.wp.components );
