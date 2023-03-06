import { writable } from 'svelte/store';

export let users = writable([]);
export let numUsers = writable(0);
export let currentUserNum = writable(-1);
export let availabilities = writable([]);
export let checks = writable([]);
export let locations = writable([]);

