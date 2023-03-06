<!-- Code referenced from https://svelte.dev/repl/8eb738732cf74edd86f680c53e6ba253?version=3.44.2 -->

<script>
	import { createForm } from "felte";
	import { users, numUsers } from './stores.js';
	export let initialValues;
	export let onSubmit;
	export let onBack;
			            
	const { form } = createForm({ onSubmit, initialValues })
	
</script>

<body>
	<div class="container">
	  <div class="row">
		<div class="col-sm-9 col-md-7 col-lg-5 mx-auto">
		  <div class="card border-0 shadow rounded-3 my-5">
			<div class="card-body p-4 p-sm-5">
			  <h5 class="card-title text-center mb-5 fw-light fs-5">What's your availability?</h5>
			  <form use:form>
				<div class="form-floating mb-3">
				  <input type="text" class="form-control" id="firstName" placeholder="First Name" name="firstName" value = "">
				</div>
				<div class="form-floating mb-3">
				  <input type="text" class="form-control" id="lastName" placeholder="Last Name" name=lastName value = "">
				</div>
				
				<div class="d-grid my-3">
					<button class="btn btn-primary btn-login text-uppercase fw-bold" type="reset">Reset
					  </button>
				  </div>
				<div class="d-grid my-3">
				  <button class="btn btn-primary btn-login text-uppercase fw-bold" type="submit">Submit
					</button>
				</div>
				
			  </form>
			</div>
		  </div>
		</div>
	  </div>
	</div>
  </body>

  <style>
	body {
  background: #007bff;
  background: linear-gradient(to right, #0062E6, #33AEFF);
}

.btn-login {
  font-size: 0.9rem;
  letter-spacing: 0.05rem;
  padding: 0.75rem 1rem;
}
</style>