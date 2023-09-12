<template>
    <div class="toolbar flex">
        <div>
            <v-btn
            :color="'primary'"
            @click="dialog = true">Add Bookmark</v-btn>
        </div>
        <v-btn icon="mdi-wrench" size="small"></v-btn>
    </div>

    <Teleport to="body">
        <template>
            <v-row justify="center">
                <v-dialog
                    v-model="dialog"
                    persistent
                    width="450">
                    <v-card>
                        <v-card-title>
                            <span class="text-h5">Add Bookmark</span>
                        </v-card-title>
                        <v-card-text>
                            <v-container>
                                <v-row>
                                    <v-col
                                        cols="12">
                                        <v-autocomplete
                                            :items="['Skiing', 'Ice hockey', 'Soccer', 'Basketball', 'Hockey', 'Reading', 'Writing', 'Coding', 'Basejump']"
                                            label="Select Folder">
                                        </v-autocomplete>
                                        <v-text-field
                                            v-if="false"
                                            label="Bookmark Folder Name">
                                        </v-text-field>
                                    </v-col>
                                </v-row>
                                <v-row>
                                    <v-col
                                        cols="12">
                                        <v-text-field
                                            label="Bookmark Title">
                                        </v-text-field>
                                    </v-col>
                                </v-row>
                                <v-row>
                                    <v-col
                                        cols="12">
                                        <v-text-field
                                            label="Bookmark URL"
                                            hint="bookmark link">
                                        </v-text-field>
                                    </v-col>
                                </v-row>
                            </v-container>
                        </v-card-text>
                        <v-card-actions>
                            <v-spacer></v-spacer>
                            <v-btn
                                color="blue-darken-1"
                                variant="text"
                                @click="dialog = false">
                                Close
                            </v-btn>
                            <v-btn
                                color="blue-darken-1"
                                variant="text"
                                @click="dialog = false">
                                Save
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-dialog>
            </v-row>
        </template>
    </Teleport>
</template>

<script setup>
    import { ref } from 'vue';

    const dialog = ref(false);
</script>

<style scoped lang="scss">
.toolbar {
    padding: 20px;
    position: fixed;
    width: 100%;

    > div:first-child {
        flex: 1;
    }
}
</style>
