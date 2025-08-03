function deleteBy(id) {
    const url = '/dentists/' + id;

    const settings = {
        method: 'DELETE',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    }

    fetch(url, settings)
        .then(response => {
            if (!response.ok) {
                throw new Error("Error al eliminar");
            }
            // eliminar fila
            let row_id = "#tr_" + id;
            document.querySelector(row_id).remove();
        })
        .catch(error => alert(error.message));
}
