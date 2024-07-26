dialog.addEventListener('click', (event) => {
    if (event.composedPath()[0] === dialog) {
        closeDialog();
    }
})