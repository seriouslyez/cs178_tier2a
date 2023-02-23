<!-- Code referenced from https://svelte.dev/repl/8eb738732cf74edd86f680c53e6ba253?version=3.44.2 -->

<script>
  import Page1 from "./components/Page1.svelte";
  import Page2 from "./components/Page2.svelte";


  const pages = [Page1, Page2];

  // The current page of our form.
  let page = 0;

  // The state of all of our pages
  let pagesState = [];

  // Our handlers
  function onSubmit(values) {
    if (page === pages.length - 1) {
      // On our final page with POST our data somewhere
      console.log('Submitted data: ', pagesState)
    } else {
      // If we're not on the last page, store our data and increase a step
      pagesState[page] = values;
      pagesState = pagesState; // Triggering update
      page +=1;
    }
  }

  function onBack(values) {
    if (page === 0) return;
		pagesState[page] = values;
    pagesState = pagesState; // Triggering update
    page -= 1;
  }
</script>

<!-- We display the current step here -->
<svelte:component
  this={pages[page]}
  {onSubmit}
  {onBack}
  initialValues={pagesState[page]}
  />
