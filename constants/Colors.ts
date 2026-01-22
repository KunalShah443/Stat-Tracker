// Madden-inspired palette: neon accent + stadium darks, while keeping a usable light mode.
const accentNeon = '#B6FF00';
const accentCyan = '#00D1FF';

export default {
  light: {
    background: '#F6F8FC',
    surface: '#FFFFFF',
    surface2: '#EEF2F7',

    text: '#0B1220',
    muted: '#556274',

    border: 'rgba(11, 18, 32, 0.14)',
    borderSoft: 'rgba(11, 18, 32, 0.08)',

    tint: accentNeon,
    tintSoft: 'rgba(182, 255, 0, 0.18)',
    accent2: accentCyan,
    accent2Soft: 'rgba(0, 209, 255, 0.16)',

    success: '#16A34A',
    danger: '#DC2626',
    warning: '#D97706',

    fieldLine: 'rgba(11, 18, 32, 0.05)',
    fieldHash: 'rgba(182, 255, 0, 0.16)',
    glow1: 'rgba(182, 255, 0, 0.16)',
    glow2: 'rgba(0, 209, 255, 0.14)',

    tabIconDefault: 'rgba(85, 98, 116, 0.72)',
    tabIconSelected: accentNeon,
    tabBarBackground: '#FFFFFF',
  },
  dark: {
    background: '#05080D',
    surface: '#0B1220',
    surface2: '#111C2F',

    text: '#E9F0FA',
    muted: '#8FA2B8',

    border: 'rgba(233, 240, 250, 0.14)',
    borderSoft: 'rgba(233, 240, 250, 0.08)',

    tint: accentNeon,
    tintSoft: 'rgba(182, 255, 0, 0.14)',
    accent2: accentCyan,
    accent2Soft: 'rgba(0, 209, 255, 0.14)',

    success: '#2DFF9D',
    danger: '#FF4D6D',
    warning: '#FFB020',

    fieldLine: 'rgba(233, 240, 250, 0.06)',
    fieldHash: 'rgba(182, 255, 0, 0.12)',
    glow1: 'rgba(182, 255, 0, 0.20)',
    glow2: 'rgba(0, 209, 255, 0.18)',

    tabIconDefault: 'rgba(143, 162, 184, 0.75)',
    tabIconSelected: accentNeon,
    tabBarBackground: '#0B1220',
  },
};
