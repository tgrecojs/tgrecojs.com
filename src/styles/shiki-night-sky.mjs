// Shiki themes for the Night sky palette (see global.css). Every token colour clears
// WCAG AA (4.5:1) against its own background; the lowest is the comment colour, 4.9:1
// in light and 5.1:1 in dark.

const theme = (name, type, c) => ({
  name,
  type,
  colors: { 'editor.background': c.bg, 'editor.foreground': c.fg },
  tokenColors: [
    { settings: { foreground: c.fg } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: c.comment, fontStyle: 'italic' } },
    { scope: ['keyword', 'storage', 'storage.type', 'storage.modifier', 'keyword.control', 'entity.name.tag'], settings: { foreground: c.keyword } },
    { scope: ['keyword.operator', 'punctuation'], settings: { foreground: c.fg } },
    { scope: ['string', 'string.template', 'punctuation.definition.string'], settings: { foreground: c.string } },
    { scope: ['constant.numeric', 'constant.language', 'constant.character', 'support.constant'], settings: { foreground: c.number } },
    { scope: ['entity.name.function', 'support.function', 'meta.function-call entity.name.function', 'entity.other.attribute-name'], settings: { foreground: c.fn } },
    { scope: ['entity.name.type', 'support.type', 'support.type.primitive', 'support.class', 'entity.other.inherited-class', 'entity.name.class'], settings: { foreground: c.type } },
  ],
});

export const nightSkyLight = theme('night-sky-light', 'light', {
  bg: '#ffffff', fg: '#0f1726', comment: '#677189',
  keyword: '#2f55d4', string: '#8a5a00', number: '#b5401f', fn: '#6b3fb8', type: '#1d7650',
});

export const nightSkyDark = theme('night-sky-dark', 'dark', {
  bg: '#080c17', fg: '#dfe6f3', comment: '#76839c',
  keyword: '#8cb0ff', string: '#f4c95d', number: '#ef8a6c', fn: '#c3a6ff', type: '#93d3b0',
});
