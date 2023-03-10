<!-- Code referenced from https://svelte.dev/repl/8eb738732cf74edd86f680c53e6ba253?version=3.44.2 -->

<script>
	import { createForm } from "felte";
	import { writable } from 'svelte/store';
	import { users, numUsers, currentUserNum, availabilities, checks, locations, startTimes, endTimes, timerNumber, days, times, locationNames, vchecks } from './stores.js';
	
	export let initialValues;
	export let onSubmit;
	export let onBack;
	let currUser;
	let boxes;
	let locs;

    // PL concept: writable stores, reactive values #reactive
	checks.subscribe(val => {boxes = val[$currentUserNum]});
	users.subscribe(val => {currUser = val[$currentUserNum]});
	locations.subscribe(val => {locs = val[$currentUserNum]});
	
	const { form, data } = createForm({ onSubmit, initialValues })

    // a bunch of data structures to track availabilities, days, times, button IDs
	export let dt = [];
	export let currAvail;

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

    // concept: availability preference
    // function to rotate through the 3 preferences
	function changeColor(color) {
	  if (color == "gray") {
	    return "green";
	  }
	  if (color == "green") {
	    return "yellow";
	  }
	  return "gray";
	}

    // rotate the color of a specific cell, or, if called from checkbox,
    // change to a fixed color
    // concepts: availability preference, logic-based rendering
	function changeThisColor(id, i, j, auto) {
	  // if just clicking one box
	  if (auto == "auto") {
		let currColor = document.getElementById(id).style.background;
		document.getElementById(id).style.background = 
		  changeColor(currColor);
		if (currColor == "green") {
		  boxes[i] = false;
		  $checks[$currentUserNum][i] = boxes[i];
		  $vchecks[$currentUserNum][j] = false;
		  document.getElementById(ud[j]).checked = false;
		  document.getElementById(ut[i]).checked = false;
		}
	  } else { // if calling from a checkbox
	    document.getElementById(id).style.background = auto;
	  }
	  // update writable stores with new user data
	  currAvail[i][j] = document.getElementById(id).style.background;
	  $availabilities[$currentUserNum][i][j] = currAvail[i][j];
	  }

    // change color for a location preference
    // concept: location, availability conditioned on location
	function changeLocColor(id, i) {
		let currColor = document.getElementById(id).style.background;
		document.getElementById(id).style.background = changeColor(currColor);
	  locs[i] = document.getElementById(id).style.background;
	  $locations[$currentUserNum][i] = locs[i];
	}

    // click a horizontal checkbox indicating availability for all 7 days
    // for one time slot
    // concept: logic-based rendering, binary availability
    // can only toggle between all green & all gray
	function clickCheckbox(row) {
	  console.log("checkbox clicked at ", row);
      if (document.getElementById(ut[row]).checked) {
        for (let j = 0; j < days.length; j++) {
          changeThisColor(dt[row][j], row, j, "green");
        }
        boxes[row] = false;
      } else {
        for (let j = 0; j < days.length; j++) {
          changeThisColor(dt[row][j], row, j, "gray");
        } 
        boxes[row] = true;
      }
      $checks[$currentUserNum][row] = boxes[row];
	}

    // same as above, but for vertical checkboxes, indicating availability
    // for all times on one day
	function clickVCheckbox(column) {
	  if (document.getElementById(ud[column]).checked) {
        for (let j = 0; j < times.length; j++) {
          changeThisColor(dt[j][column], j, column, "green");
        }
        $vchecks[$currentUserNum][column] = false;
	  } else {
	    for (let j = 0; j < times.length; j++) {
	      changeThisColor(dt[j][column], j, column, "gray");
	    }
	    $vchecks[$currentUserNum][column] = true;
	  }
	}


</script>

<div class="jumbotron">
	<h1 class="display-4">Enter Availability for {currUser}</h1>
	<hr class="my-4">
	<p class="lead"><span class="bolded">Select once for "Available" and twice for "If need be".</span></p>
	<p>Note: all times in Eastern Standard Time.</p>
  </div>

<div class="container">
	<form use:form>
		<label for=aboutMe style="font-size:1.5em">Select preferred location(s):</label><br>
		<div class="d-grid my-3">
		{#each locationNames as location, i}
		
			<button id={location} style="background:{locs[i]};color:black;border:blue 2px;" class="btn btn-primary btn-login text-uppercase fw-bold btn-loc" type="button" on:click={() => changeLocColor(location, i)}>{locationNames[i]}   
				</button>    
		{/each}

		</div>
		
		<div class="table-responsive">
		    <!-- display all days and times in a 2D grid - concept: logic-based rendering -->
			<table class="table table-bordered text-center">
				<thead>
				    <tr> 
				      <th></th>
				      {#each days as day, i}
				      <th><input type="checkbox" id={ud[i]} name={day} value={day} on:click={() => clickVCheckbox(i)}></th>
				      {/each}
				    </tr>
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
						<td><input type="checkbox" id={ut[i]} name={time} value={time} on:click={() => clickCheckbox(i)}></td>
						{#each days as day, j}
						  <!-- change color on user click -->
						  <td nowrap style="background:{currAvail[i][j]};color:black" id={dt[i][j]}>
							<button style="width:100%" type="button" class="btn btn-primary text-uppercase fw-bold" on:click={() => changeThisColor(dt[i][j], i, j, "auto")}>{time}  
							</button>
						  </td>
						{/each}
				  	</tr>
				  	{/each}
				</thead>
			</table>
		</div>
		<div class="d-grid my-3">
			<button class="btn btn-primary btn-login text-uppercase fw-bold" type="button" value="Back" on:click={() => onBack($data)}>Back
				</button>
				
			<button class="btn btn-primary btn-login text-uppercase fw-bold" type="submit" value="Submit">Submit
			  </button>
		</div>
	</form>
</div>
			

<style>

.bg-light-gray {
    background-color: #f7f7f7;
}
.table-bordered thead td, .table-bordered thead th {
    border-bottom-width: 2px;
}
.table thead th {
    vertical-align: bottom;
    border-bottom: 2px solid #dee2e6;
}
.table-bordered td, .table-bordered th {
    border: 1px solid #dee2e6;
}

.table-bordered td, .table-bordered th {
    border: 1px solid #dee2e6;
}
.table td, .table th {
    padding: .75rem;
    vertical-align: top;
    border-top: 1px solid #dee2e6;
}

.btn-login {
  font-size: 0.9rem;
  letter-spacing: 0.05rem;
  padding: 0.75rem 1rem;
}
.bolded { 
	font-weight: bold; 
}
.btn-loc {
	margin-right: 5px;
}
</style>


