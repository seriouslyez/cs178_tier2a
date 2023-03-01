<script>
	
	let buttonProps = {
	class:[$$restProps.class]
	}
</script>
	<button on:click
			on:mouseover
			on:mouseenter
			on:mouseleave
		{...buttonProps}>
			<slot/>
	</button>

<style>
	.notavailable{
		background-color:blue;
		color:black;
		width:5%
	}
	.danger {
		color:red;
	}
	.sm {
		font-size:1em;
		padding:0.1em;
	}
	.lg {
		font-size:2em
	}
</style>