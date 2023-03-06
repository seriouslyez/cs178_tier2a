import { writable } from 'svelte/store';

export let users = writable([]);
export let numUsers = writable(0);
export let currentUserNum = writable(-1);
export let availabilities = writable([]);
export let checks = writable([]);
export let locations = writable([]);
export let startTimes = writable([]);
export let endTimes = writable([]);
export let timerNumber = writable(-1);
export let days = ["Monday   ", "Tuesday  ", "Wednesday ", "Thursday ", 
					   "Friday   ", "Saturday ", "Sunday   "];
export let times = [
						"9:00 am  ", "9:15 am  ", "9:30 am  ", "9:45 am  ",
						"10:00 am ", "10:15 am ", "10:30 am ", "10:45 am ",
						"11:00 am ", "11:15 am ", "11:30 am ", "11:45 am ",
						"12:00 pm ", "12:15 pm ", "12:30 pm ", "12:45 pm ",
						"1:00 pm  ", "1:15 pm  ", "1:30 pm  ", "1:45 pm  ",
						"2:00 pm  ", "2:15 pm  ", "2:30 pm  ", "2:45 pm  ",
						"3:00 pm  ", "3:15 pm  ", "3:30 pm  ", "3:45 pm  ",
						"4:00 pm  ", "4:15 pm  ", "4:30 pm  ", "4:45 pm  ",
						"5:00 pm  ", "5:15 pm  ", "5:30 pm  ", "5:45 pm  ",
						"6:00 pm  ", "6:15 pm  ", "6:30 pm  ", "6:45 pm  ",];
export let locationNames = ["Cambridge (River)", "Cambridge (Yard)", 
                          "Cambridge (Quad)", "Allston", "Virtual"];
export let usersForTime = writable([]);


