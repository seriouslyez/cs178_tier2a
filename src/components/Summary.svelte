<script>
	import { createForm } from "felte";
	import { writable } from 'svelte/store';
	import { users, numUsers, currentUserNum, availabilities, checks, locations, startTimes, endTimes, timerNumber, days, times, locationNames, vchecks } from './stores.js';
	
	export let onBack;
	let currUser;
	let boxes;
	let locs;

	checks.subscribe(val => {boxes = val[$currentUserNum]});

	users.subscribe(val => {currUser = val[$currentUserNum]});

	locations.subscribe(val => {locs = val[$currentUserNum]});

    const { form, data } = createForm({})
	
	export let dt = [];
	export let currAvail;
	let putItBackTogether = [];

	availabilities.subscribe(val => {currAvail = val[$currentUserNum]});

	export let ut = [];
	for (let i = 0; i < times.length; i++) {
	  ut.push(times[i] + currUser);
	}

	export let ud = [];
	for (let i = 0; i < days.length; i++) {
	  ud.push(days[i] + currUser);
	}
  
	for (let i = 0; i < times.length; i++) {
	    dt.push([]);
	    for (let j = 0; j < days.length; j++) {
	      dt[i].push(days[j] + times[i]);
	    }
	}

</script>

<body>
    <div class="jumbotron">
        <h1 class="display-4">Availability Summary</h1>
        
      </div>
    <div class="d-grid my-3">
        <button class="btn btn-primary btn-login text-uppercase fw-bold" type="button" value="Back" on:click={() => onBack($data)}>Back
            </button>
    </div>
</body>