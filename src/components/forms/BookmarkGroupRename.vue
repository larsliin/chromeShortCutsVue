<template>
    <v-card>
        <v-form
            ref="form"
            fast-fail
            @submit.prevent="onConfirm()">
            <v-card-text>
                <v-container>
                    <v-row>
                        <v-col cols="12">
                            <span class="text-h5">Rename Group</span>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col cols="12">
                            <v-text-field
                                v-model="name"
                                label="Group Name"
                                autofocus
                                :rules="[rules.required]"
                                @keydown.esc="onCancel()" />
                        </v-col>
                    </v-row>
                </v-container>
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn
                    color="blue-darken-1"
                    variant="text"
                    @click="onCancel()">
                    Cancel
                </v-btn>
                <v-btn
                    color="blue-darken-1"
                    variant="tonal"
                    type="submit">
                    Save
                </v-btn>
            </v-card-actions>
        </v-form>
    </v-card>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import { EMITS, GROUPING } from '@/constants';

    interface Props {
        value?: string;
    }

    const props = defineProps<Props>();

    const emits = defineEmits<{
        confirm: [name: string];
        cancel: [];
    }>();

    const name = ref(props.value ?? '');
    const form = ref();

    const rules = {
        required: (value: unknown) => !!String(value ?? '').trim() || 'Field is required',
    };

    async function onConfirm(): Promise<void> {
        const formValidation = await form.value?.validate();
        if (formValidation && !formValidation.valid) {
            return;
        }
        const trimmed = name.value.trim();
        emits(EMITS.CONFIRM, trimmed.length ? trimmed : GROUPING.DEFAULT_NAME);
    }

    function onCancel(): void {
        emits(EMITS.CANCEL);
    }
</script>
