<script>
	import { createForm } from "felte";
	import { writable } from 'svelte/store';
	import { users, numUsers, currentUserNum, availabilities, checks, locations, startTimes, endTimes, timerNumber, days, times, locationNames, vchecks } from './stores.js';
	
	export let onBack;

	// summary structures
		let availSums = [];
		let needSums = []

		let availLocs = [0, 0, 0, 0, 0];
		let needLocs = [0, 0, 0, 0, 0];
	
	// create summaries only if there is at least one user
	if ($numUsers > 0) {	
		for (let i = 0; i < times.length; i++) {
			availSums.push([]);
			needSums.push([]);
			for (let j = 0; j < days.length; j++) {
				availSums[i].push(0);
				needSums[i].push(0);
			}
		}
		
		for (let u = 0; u < $numUsers; u++) {
			for (let i = 0; i < locationNames.length; i++) {
				if ($locations[u][i] === "green") {
					availLocs[i] += 1;
					needLocs[i] += 1;
				} else if ($locations[u][i] === "yellow") {
					needLocs[i] += 1;
				}
			}
			for (let i = 0; i < times.length; i++) {
				for (let j = 0; j < days.length; j++) {
					if ($availabilities[u][i][j] === "green") {
						availSums[i][j] += 1;
						needSums[i][j] += 1;
					} else if ($availabilities[u][i][j] === "yellow") {
						needSums[i][j] += 1;
					}
				}
			}
		}
	}

	// functions to toggle available vs if need be summaries
	let screen = 0;

	function setAvail() {
		if (screen == 0){ 
			return;
		} else {
			screen -= 1
		}
	}

	function setNeed(){
		if (screen == 1) {
			return;
		} else {
			screen += 1
		}
	}

</script>

<body>
    <div class="jumbotron">
        <h1 class="display-4">Availability Summary</h1>
    </div>
	<div>
	{#if $users.length >= 1 }
	<div>
		<p class="lead room">Toggle between 'Definitely Available' and 'Include Possibles'</p>
		<p class="room bolded">Note: 'Include Possibles' adds if need be availabilities to definite availabilities</p>
	</div>
	<div class="d-grid my-3">
        <button class="btn btn-primary btn-login text-uppercase fw-bold room" type="button" value="avail" on:click={() => setAvail()}>Definitely Available
            </button>
    
        <button class="btn btn-primary btn-login text-uppercase fw-bold less" type="button" value="need" on:click={() => setNeed()}>Include Possibles
            </button>
    </div>
	<!-- Summary of Locations-->
	<div class="table-responsive">
		<!-- display all days and times in a 2D grid - concept: logic-based rendering -->
		<table class="table table-bordered text-center">
			<thead>
				<tr class="bg-light-gray">
					{#each locationNames as ln, i}
					<td class="text-uppercase freeze">{ln}</td>
					{/each}
				</tr>
				<tr>
					{#each locationNames as ln, i}
					{#if screen == 0}
						{#if availLocs[i] > 0}

					  	<td nowrap style="background: #FFFACD;color:black" >
							{availLocs[i]}
					  	</td>
					  	{:else}
						<td nowrap style="background: #F5F5F5;color:black" >
							{availLocs[i]}
					  	</td>
						{/if}
					{:else}
						{#if needLocs[i] > 0} 
					  	<td nowrap style="background: #FFFACD;color:black" >
							{needLocs[i]}
					  	</td>
						{:else}
						<td nowrap style="background: #F5F5F5;color:black" >
							{needLocs[i]}
					  	</td>
						{/if}
					  {/if}
					{/each}
				</tr>
			</thead>
		</table>
	</div>
	<!--Summary of Times-->
	<div class="table-responsive">
		<!-- display all days and times in a 2D grid - concept: logic-based rendering -->
		<table class="table table-bordered text-center">
			<thead>
				<tr class="bg-light-gray">
					<td class="text-uppercase freeze">Time
					</td>
					<td class="text-uppercase freeze">Monday</td>
					<td class="text-uppercase freeze">Tuesday</td>
					<td class="text-uppercase freeze">Wednesday</td>
					<td class="text-uppercase freeze">Thursday</td>
					<td class="text-uppercase freeze">Friday</td>
					<td class="text-uppercase freeze">Saturday</td>
					<td class="text-uppercase freeze">Sunday</td>
				</tr>
				{#each times as time, i}
				<tr id={i}>
					<td>{time}</td>
					{#each days as day, j}

					{#if screen == 0}
						{#if availSums[i][j] > 0}

					  	<td nowrap style="background: #FFFACD;color:black" >
							{availSums[i][j]}
					  	</td>
					  	{:else}
						<td nowrap style="background: #F5F5F5;color:black" >
							{availSums[i][j]}
					  	</td>
						{/if}
					  {:else}
						{#if needSums[i][j] > 0} 
					  	<td nowrap style="background: #FFFACD;color:black" >
							{needSums[i][j]}
					  	</td>
						{:else}
						<td nowrap style="background: #F5F5F5;color:black" >
							{needSums[i][j]}
					  	</td>
						{/if}
					  {/if}
					{/each}
				  </tr>
				  {/each}
			</thead>
		</table>
	</div>
	{:else}
	<p class="lead"><span class="bolded room">Summary Unavailable: Please enter availability first.</span></p>
	{/if}
	</div>
    <div class="d-grid my-3">
        <button class="btn btn-primary btn-login text-uppercase fw-bold room" type="button" value="Back" on:click={() => onBack()}>Back
            </button>
    </div>
</body>
<style>
	.room {
		margin-left: 20px;
	}
	.less {
		margin-left: 10px;
	}
	.bolded { 
	font-weight: bold; 
	}
</style>