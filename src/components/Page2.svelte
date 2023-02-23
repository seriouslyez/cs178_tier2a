<!-- Code referenced from https://svelte.dev/repl/8eb738732cf74edd86f680c53e6ba253?version=3.44.2 -->

<script>
	import { createForm } from "felte"
	
	export let initialValues;
	export let onSubmit;
	export let onBack;
	
	const { form, data } = createForm({ onSubmit, initialValues })
</script>

<form use:form>
	<label for=aboutMe>More about me</label>
	<textarea id=aboutMe name=aboutMe /><br>
	<button type=button on:click={() => onBack($data)}>Previous page</button>
	<button type=submit>Submit</button>
</form>