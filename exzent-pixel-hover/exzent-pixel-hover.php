<?php
/**
 * Plugin Name:  EXZENT Pixel Hover
 * Description:  Pixel-Dissolve Hover-Effekt für Link-Listen. Block einmal einsetzen, Selector konfigurieren – fertig.
 * Version:      1.0.0
 * Author:       EXZENT
 * License:      GPL-2.0-or-later
 * Text Domain:  exzent-pixel-hover
 */

defined( 'ABSPATH' ) || exit;

/* ─────────────────────────────────────────────────────────────────────────────
   REGISTER BLOCK
   ───────────────────────────────────────────────────────────────────────────── */
function exzent_pixel_hover_init() {

    // Editor script (block.js – no-build, plain JS)
    wp_register_script(
        'exzent-pixel-hover-block',
        plugins_url( 'block.js', __FILE__ ),
        [ 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-i18n' ],
        '1.0.0',
        true
    );

    // Frontend engine (only enqueued when block is present on page)
    wp_register_script(
        'exzent-pixel-hover-frontend',
        plugins_url( 'pixel-hover.js', __FILE__ ),
        [],
        '1.0.0',
        true   // footer
    );

    // Minimal editor styles
    wp_register_style(
        'exzent-pixel-hover-editor',
        plugins_url( 'editor.css', __FILE__ ),
        [ 'wp-edit-blocks' ],
        '1.0.0'
    );

    register_block_type( 'exzent/pixel-hover', [
        'editor_script'   => 'exzent-pixel-hover-block',
        'editor_style'    => 'exzent-pixel-hover-editor',
        'render_callback' => 'exzent_pixel_hover_render',
        'attributes'      => [
            // Targeting
            'targetMode'     => [ 'type' => 'string',  'default' => 'selector' ],
            'targetSelector' => [ 'type' => 'string',  'default' => '' ],
            'targetClass'    => [ 'type' => 'string',  'default' => '' ],
            // Appearance
            'pixelColor'     => [ 'type' => 'string',  'default' => '#222222' ],
            // Grid
            'rows'           => [ 'type' => 'number',  'default' => 6 ],
            // Animation
            'exitDuration'   => [ 'type' => 'number',  'default' => 380 ],
            'colorFade'      => [ 'type' => 'number',  'default' => 100 ],   // %
            'randomWeight'   => [ 'type' => 'number',  'default' => 45 ],    // %
            'staggerBase'    => [ 'type' => 'number',  'default' => 55 ],    // %
            'biasAngle'      => [ 'type' => 'number',  'default' => 0 ],     // deg
            'autoAngle'      => [ 'type' => 'boolean', 'default' => false ],
            'doublePct'      => [ 'type' => 'number',  'default' => 0 ],     // %
        ],
    ] );
}
add_action( 'init', 'exzent_pixel_hover_init' );


/* ─────────────────────────────────────────────────────────────────────────────
   SERVER-SIDE RENDER
   Gibt nur ein unsichtbares <div data-config="..."> aus.
   Das globale pixel-hover.js liest es beim DOMContentLoaded aus.
   ───────────────────────────────────────────────────────────────────────────── */
function exzent_pixel_hover_render( $attrs ) {

    // Frontend-Script nur laden wenn der Block tatsächlich auf der Seite ist
    wp_enqueue_script( 'exzent-pixel-hover-frontend' );

    $config = wp_json_encode( [
        'targetMode'     => $attrs['targetMode'],
        'targetSelector' => $attrs['targetSelector'],
        'targetClass'    => $attrs['targetClass'],
        'pixelColor'     => $attrs['pixelColor'],
        'rows'           => (int) $attrs['rows'],
        'exitDuration'   => (int) $attrs['exitDuration'],
        'colorFade'      => (int) $attrs['colorFade']    / 100,
        'randomWeight'   => (int) $attrs['randomWeight'] / 100,
        'staggerBase'    => (int) $attrs['staggerBase']  / 100,
        'biasAngle'      => (int) $attrs['biasAngle'],
        'autoAngle'      => (bool) $attrs['autoAngle'],
        'doublePct'      => (int) $attrs['doublePct']    / 100,
    ] );

    return sprintf(
        '<div class="exzent-pixel-hover-config" data-config="%s" style="display:none;width:0;height:0;overflow:hidden;" aria-hidden="true"></div>',
        esc_attr( $config )
    );
}
