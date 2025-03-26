function scrapPACS(documentName = 'data'){
	const rows = document.querySelectorAll("tr[role='row']")
	let data = 'id; nombre; fecha; descripcion'
	rows.forEach((row, index) => {
		if (index == 0) return false
		const name = row.childNodes[1].textContent
		const id = row.childNodes[4].textContent
		const date_and_time = (row.childNodes[2].innerText).split(' ')
		const date = date_and_time[0]
		const description = row.childNodes[11].textContent
		data += `\n${id}; ${name}; ${date}; ${description}`
	})
	const blob = new Blob([data], { type: "text/csv" });

	// Crear un enlace de descarga
	const url = URL.createObjectURL(blob)
	const a = document.createElement("a")
	a.href = url
	a.download = `${documentName}.csv`
	document.body.appendChild(a)
	a.click()

	// Limpiar el enlace de descarga
	document.body.removeChild(a)
	URL.revokeObjectURL(url)
}

/*
const script = document.createElement('script');
script.src = 'http://127.0.0.1:5500/pacs_scrapping.js';
script.onload = () => console.log('pacs_scrapping añadido exitosamente');
document.head.appendChild(script);
*/