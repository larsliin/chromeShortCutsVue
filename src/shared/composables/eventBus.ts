import { ref } from 'vue';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const bus = ref(new Map<string, any>());

export default function useEventsBus() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function emit(event: string, ...args: any[]): void {
        bus.value.set(event, args);
    }

    return {
        emit,
        bus,
    };
}
