import { describe, it, expect } from 'vitest';
import { mountWithPlugins } from '../test-utils';
import ToolTip from '@/components/fields/ToolTip.vue';

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

function mountTooltip(tooltip = 'Helpful description') {
    return mountWithPlugins(ToolTip, { props: { tooltip } });
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('ToolTip — rendering', () => {
    it('mounts without errors', () => {
        const wrapper = mountTooltip();

        expect(wrapper.exists()).toBe(true);
    });

    it('renders the icon-container activator element', () => {
        const wrapper = mountTooltip();

        expect(wrapper.find('.icon-container').exists()).toBe(true);
    });

    it('renders an icon inside the activator', () => {
        const wrapper = mountTooltip();

        // Vuetify renders v-icon as <i class="v-icon"> containing an SVG path
        expect(wrapper.find('.icon-container .v-icon').exists()).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

describe('ToolTip — props', () => {
    it('accepts a plain-text tooltip prop', () => {
        const wrapper = mountTooltip('Click here for help');

        expect(wrapper.props('tooltip')).toBe('Click here for help');
    });

    it('accepts HTML content in the tooltip prop without throwing', () => {
        expect(() => mountTooltip('<strong>Bold</strong> help text')).not.toThrow();
    });

    it('renders a different icon-container for each instance', () => {
        const a = mountTooltip('First');
        const b = mountTooltip('Second');

        expect(a.find('.icon-container').exists()).toBe(true);
        expect(b.find('.icon-container').exists()).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('ToolTip — accessibility', () => {
    it('icon wrapper is present for screen-reader activator binding', () => {
        const wrapper = mountTooltip('Accessible tooltip');

        // Vuetify binds aria-describedby/aria-expanded via the activator slot props
        // The .icon-container is the activator element that receives those attributes
        const container = wrapper.find('.icon-container');
        expect(container.exists()).toBe(true);
    });
});