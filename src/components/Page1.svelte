<!-- Code referenced from https://svelte.dev/repl/8eb738732cf74edd86f680c53e6ba253?version=3.44.2 -->

<script>
	import { createForm } from "felte"
	
	export let initialValues;
	export let onSubmit;
	
	const { form } = createForm({ onSubmit, initialValues })
</script>

<form use:form>
	<label for=firstName>First name</label>
	<input id=firstName name=firstName>
	<label for=lastName>Last name</label>
	<input id=lastName name=lastName><br>
	<button type=submit>Next page</button>
</form>