// frontend/js/modules/utils/svgRenderer.js

import { configManager } from '@modules/config'

/**
 * Injeta um ícone SVG inline a partir de um <symbol> em um sprite.
 *
 * @param {HTMLElement} container
 *   Elemento onde o SVG será inserido.
 * @param {string} iconId
 *   ID do <symbol> no arquivo de sprite (sem '#').
 * @param {Object} [opts]
 * @param {string} [opts.className='']
 *   Classe(s) CSS adicionais para o <svg>.
 * @param {string} [opts.title]
 *   Texto de acessibilidade para <title>.
 * @param {number|string} [opts.width]
 *   Atributo width (px ou unidade CSS).
 * @param {number|string} [opts.height]
 *   Atributo height (px ou unidade CSS).
 * @param {string} [opts.spriteUrl]
 *   URL do arquivo de sprite; default: configManager.get('spriteUrl') || '/assets/sprite.svg'
 *
 * @returns {SVGElement|null}
 *   O <svg> criado, ou null em caso de container inválido ou iconId vazio.
 */
export function renderSvgIcon(
  container,
  iconId,
  {
    className = '',
    title,
    width,
    height,
    spriteUrl
  } = {}
) {
  if (!(container instanceof HTMLElement) || typeof iconId !== 'string' || !iconId.trim()) {
    return null
  }

  const SVG_NS   = 'http://www.w3.org/2000/svg'
  const XLINK_NS = 'http://www.w3.org/1999/xlink'
  const sprite   = spriteUrl
    || configManager.get('spriteUrl')
    || '/assets/sprite.svg'

  // Limpa conteúdo anterior
  container.textContent = ''

  // Cria <svg> e define atributos básicos
  const svg = document.createElementNS(SVG_NS, 'svg')
  if (className) svg.setAttribute('class', className)
  if (width)     svg.setAttribute('width',  String(width))
  if (height)    svg.setAttribute('height', String(height))

  svg.setAttribute('aria-hidden', title ? 'false' : 'true')
  svg.setAttribute('focusable', 'false')

  // <title> para leitores de tela
  if (title) {
    const titleEl = document.createElementNS(SVG_NS, 'title')
    titleEl.textContent = title
    svg.appendChild(titleEl)
  }

  // <use> referenciando o símbolo no sprite
  const useEl = document.createElementNS(SVG_NS, 'use')
  const hrefVal = `${sprite}#${iconId}`

  useEl.setAttributeNS(null,      'href',       hrefVal)
  useEl.setAttributeNS(XLINK_NS,  'xlink:href', hrefVal)
  svg.appendChild(useEl)

  container.appendChild(svg)
  return svg
}
