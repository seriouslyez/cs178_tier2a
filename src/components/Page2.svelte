<!-- Code referenced from https://svelte.dev/repl/8eb738732cf74edd86f680c53e6ba253?version=3.44.2 -->

<script>
	import { createForm } from "felte";
	import Button from './Button.svelte';
	import { writable } from 'svelte/store';
	import { users, numUsers, currentUserNum, availabilities, checks, locations, startTimes, endTimes, timerNumber, days, times, locationNames, vchecks } from './stores.js';
	
	export let initialValues;
	export let onSubmit;
	export let onBack;
	let currUser;
	let boxes;
	let locs;

	checks.subscribe(val => {boxes = val[$currentUserNum]});

	users.subscribe(val => {currUser = val[$currentUserNum]});

	locations.subscribe(val => {locs = val[$currentUserNum]});
	
	const { form, data } = createForm({ onSubmit, initialValues })


    
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

	function changeColor(color) {
	  if (color == "gray") {
	    return "green";
	  }
	  if (color == "green") {
	    return "yellow";
	  }
	  return "gray";
	}

	function changeThisColor(id, i, j, auto) {
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
	  } else {
	    document.getElementById(id).style.background = auto;
	  }
	  currAvail[i][j] = document.getElementById(id).style.background;
	  $availabilities[$currentUserNum][i][j] = currAvail[i][j];
	  }

	function changeLocColor(id, i) {
		let currColor = document.getElementById(id).style.background;
		document.getElementById(id).style.background = changeColor(currColor);
	  locs[i] = document.getElementById(id).style.background;
	  $locations[$currentUserNum][i] = locs[i];
	}

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
		{#each locationNames as location, i}
		<div class="d-grid my-3">
			<button id={location} style="background:{locs[i]};color:black;border:blue 2px;" class="btn btn-primary text-uppercase fw-bold btn-login" type="button" on:click={() => changeLocColor(location, i)}>{locationNames[i]}
				</button>
		</div>
		{/each}
		<div class="table-responsive">
			<table class="table table-bordered text-center">
				<thead>
				    <tr> 
				      <th></th>
				      {#each days as day, i}
				      <th><input type="checkbox" id={ud[i]} name={day} value={day} on:click={() => clickVCheckbox(i)}></th>
				      {/each}
				    </tr>
					<tr class="bg-light-gray">
						<td class="text-uppercase">Time
						</td>
						<td class="text-uppercase">Monday</td>
						<td class="text-uppercase">Tuesday</td>
						<td class="text-uppercase">Wednesday</td>
						<td class="text-uppercase">Thursday</td>
						<td class="text-uppercase">Friday</td>
						<td class="text-uppercase">Saturday</td>
						<td class="text-uppercase">Sunday</td>
					</tr>
					{#each times as time, i}
					<tr id={i}>
						<td><input type="checkbox" id={ut[i]} name={time} value={time} on:click={() => clickCheckbox(i)}></td>
						{#each days as day, j}
						  <td nowrap style="background:{currAvail[i][j]};color:black" id={dt[i][j]}>
							<button style="width:100%" type="button" class="notavailable sm btn btn-primary text-uppercase fw-bold" on:click={() => changeThisColor(dt[i][j], i, j, "auto")}>{time}  
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
		</div>
		<div class="d-grid my-3">
			<button class="btn btn-primary btn-login text-uppercase fw-bold" type="submit" value="Submit">Submit
			  </button>
		</div>
	</form>
</div>
			

<style>
body{
    margin-top:20px;
}
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


.bg-sky.box-shadow {
    box-shadow: 0px 5px 0px 0px #00a2a7
}

.bg-orange.box-shadow {
    box-shadow: 0px 5px 0px 0px #af4305
}

.bg-green.box-shadow {
    box-shadow: 0px 5px 0px 0px #4ca520
}

.bg-yellow.box-shadow {
    box-shadow: 0px 5px 0px 0px #dcbf02
}

.bg-pink.box-shadow {
    box-shadow: 0px 5px 0px 0px #e82d8b
}

.bg-purple.box-shadow {
    box-shadow: 0px 5px 0px 0px #8343e8
}

.bg-lightred.box-shadow {
    box-shadow: 0px 5px 0px 0px #d84213
}


.bg-sky {
    background-color: #02c2c7
}

.bg-orange {
    background-color: #e95601
}

.bg-green {
    background-color: #5bbd2a
}

.bg-yellow {
    background-color: #f0d001
}

.bg-pink {
    background-color: #ff48a4
}

.bg-purple {
    background-color: #9d60ff
}

.bg-lightred {
    background-color: #ff5722
}

.padding-15px-lr {
    padding-left: 15px;
    padding-right: 15px;
}
.padding-5px-tb {
    padding-top: 5px;
    padding-bottom: 5px;
}
.margin-10px-bottom {
    margin-bottom: 10px;
}
.border-radius-5 {
    border-radius: 5px;
}

.margin-10px-top {
    margin-top: 10px;
}
.font-size14 {
    font-size: 14px;
}

.text-light-gray {
    color: #d6d5d5;
}
.font-size13 {
    font-size: 13px;
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
</style>


