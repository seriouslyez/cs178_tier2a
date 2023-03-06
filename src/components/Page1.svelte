<!-- Code referenced from https://svelte.dev/repl/8eb738732cf74edd86f680c53e6ba253?version=3.44.2 -->

<script>
	import { createForm } from "felte";
	import { users, numUsers } from './stores.js';
	export let initialValues;
	export let onSubmit;
	export let onBack;
			            
	const { form } = createForm({ onSubmit, initialValues })

	function handleSuccess(event) {
		const { response, ...context } = event.detail;

		response.reset;
		
	}

	
</script>

<form use:form method='post' on:feltesuccess="{handleSuccess}">
	<label for=firstName>First name</label>
	<input id=firstName name=firstName value = "">
	<label for=lastName>Last name</label>
	<input id=lastName name=lastName value = ""><br>
	<button type=submit>Next page</button>
</form>