const URL_ADDRES = 'https://bpqvdvboomyzlctwrtag.supabase.co'
const PUBLIC_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwcXZkdmJvb215emxjdHdydGFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3NjY3ODUsImV4cCI6MjA0NjM0Mjc4NX0.Spe8AOXF84l8pbxmWGIXtX7pjhBI30JjE2hlmzkSE7Y'
let _supabase = null
let pacientes = []
const filtros = ['ASPARTATO', 'ALANINO', 'BILIRRUBINA', 'FOSFATASA', 'HEMOGLOBINA']
let indiceDocumento = 0
let filtros_activos = false

async function iniciar(){
	// Añade la libreria moment.js
	const script = document.createElement('script')
	script.src = 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.30.1/moment.min.js'
	script.onload = () => console.log('Moment.js añadido exitosamente')
	document.head.appendChild(script)
	await esperar(2000)

	// Añade la libreria Supabase
	const script_supabase = document.createElement('script')
	script_supabase.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js'
	script_supabase.onload = () => console.log('Supabase añadido exitosamente')
	document.head.appendChild(script_supabase)
	await esperar(2000)

	// Instancia de Supabase
	_supabase = supabase.createClient(URL_ADDRES, PUBLIC_KEY)
	pacientes = await getData()
	console.log("Pacientes: ", pacientes)

	// Genera una función que intercepta las peticiones
	originalXhrOpen = XMLHttpRequest.prototype.open;

	XMLHttpRequest.prototype.open = function (...args) {
		this.addEventListener('load', function () {
			/* 
			 *	Función que maneja las interceptaciones
			 *	responseText(respuesta en formato dexto de la interceptación)
			*/
			condicion(this.responseText)
		})
		originalXhrOpen.apply(this, args);
	}
	
	/**
	 * Inicializa los componentes de la fecha inicial en variables
	 * fechaInicio corresponde al input visible
	 * hfechaInicio corresponde al input oculto
	 */
	fechaInicio = document.querySelector('#CurFecha_dateInput')
	hfechaInicio = document.querySelector('#CurFecha_dateInput_ClientState')

	/**
	 *	Inicializa los componentes de la fecha inicial en variables
	 *	fechaFin corresponde al input visible
	 *	hfechaFin corresponde al input oculto
	*/
	fechaFin = document.querySelector('#CurFechaE_dateInput')
	hfechaFin = document.querySelector('#CurFechaE_dateInput_ClientState')


	tipoBusqueda = document.querySelector('#searchOptions_2') // Elemeto de tipo de búsqueda (radio)
	btnBusqueda = document.querySelector('#btn_Tmp') // Botón buscar

	tipoBusqueda.click() // Hace clíc para seleccinar búsqueda por documento

	//Inicializa los componentes del documento
	txHistoria = document.querySelector('#txtHistoria')
	txHistoria_text = document.querySelector('#txtHistoria_text')
	txHistoria_Value = document.querySelector('#txtHistoria_Value')

	await esperar(5000)
	siguiente()
}


function cambiarFecha(fechaUsuario, fin = false){
	const fecha = moment(fechaUsuario)
	if(!fin){
		fechaInicio.value = `${fecha.format('DD/MM/YYYY')}`
		hfechaInicio.value = `{"enabled":true,"emptyMessage":"","validationText":"${fecha.format('YYYY-MM-DD')}-00-00-00","valueAsString":"${fecha.format('YYYY-MM-DD')}-00-00-00","minDateStr":"1980-01-01-00-00-00","maxDateStr":"2099-12-31-00-00-00","lastSetTextBoxValue":"${fecha.format('DD/MM/YYYY')}"}`
	} else {
		fechaFin.value = `${fecha.format('DD/MM/YYYY')}`
		hfechaFin.value = `{"enabled":true,"emptyMessage":"","validationText":"${fecha.format('YYYY-MM-DD')}-00-00-00","valueAsString":"${fecha.format('YYYY-MM-DD')}-00-00-00","minDateStr":"1980-01-01-00-00-00","maxDateStr":"2099-12-31-00-00-00","lastSetTextBoxValue":"${fecha.format('DD/MM/YYYY')}"}`
	}
}

function changeDocument(documento){
	documento = documento.toString()
	let longitudDocumento = [...documento].length
	tdocumento = documento + '_'.repeat(20-longitudDocumento)
	txHistoria.value = documento
	txHistoria_text.value = tdocumento
	txHistoria_Value.value = tdocumento
}


function click(){
	btnBusqueda = document.querySelector('#btn_Tmp')
	btnBusqueda.click()
}


let n_filas = []

async function condicion(responseText){
	if(responseText.indexOf('updatePanel|PnlHistoriasPanel')>=0 ) {
		await esperar(5000)
		console.log(document.querySelector('#gridHistorias_ctl00 > tbody > tr.rgGroupHeader > td:nth-child(2) > p')?.textContent)
		const filas = document.querySelectorAll('#gridHistorias_ctl00>tbody>tr>td>a')
		const nfilas = []
		filas.forEach((fila) => {if(fila.text !== '') nfilas.push(fila)})
		for(const fila of nfilas){
			const regex = /__doPostBack\('([^']*)',/;
			const resultado = fila.href.match(regex)
			if(resultado) __doPostBack(resultado[1],'')
			await esperar(5000)
		}
		await insertData()
		await updateData()
		siguiente()
	} else if(responseText.indexOf('updatePanel|Panel1Panel') >= 0) {
		await esperar(1000)
		const filas = document.querySelectorAll('#gridOrdenes_ctl00>tbody>tr')
		if(!filas || filas?.length == 0) return false
		orden = document.querySelector('#LblOrder')?.textContent.split(': ')[1]
		documento = document.querySelector('#Historias1_DemoHistoria_ctl00_RadMaskedTextBox1').value
		documento = documento.slice(0, documento.indexOf('_'))
		filas.forEach((fila) => {
			if (fila.className != 'rgGroupHeader'){
				const laboratorio = fila.childNodes[3].textContent
				if (filtros_activos){
					if(!filtros.some(filtro => laboratorio.includes(filtro))) return false // Aplica los filtros de los paraclínicos
				}
				const val_ref = fila.childNodes[5].textContent.split('   -   ')
				const fecha = `${moment(orden.slice(0,8)).format('YYYY-MM-DD')}`
				n_filas.push({
					orden: orden.slice(8, orden.length),
					documento,
					fecha,
					codigo: fila.childNodes[2].textContent,
					laboratorio,
					valor: parseFloat(fila.childNodes[4].textContent),
					min: val_ref[0] || null,
					max: val_ref[1] || null,
					unidad: fila.childNodes[7].textContent.trim()
				})
			}
		})
	}
}

function esperar(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function siguiente(){
	if(indiceDocumento >= pacientes.length){
		indiceDocumento = 0
		pacientes = await getData()
		if(pacientes.length >= 1) siguiente()
		else console.log('Análisis completado', n_filas)
		return false
	}
	n_filas = []
	const fecha = moment(pacientes[indiceDocumento].fecha)
	cambiarFecha(fecha.subtract(1, 'd').format())
	cambiarFecha(fecha.add(2, 'd').format(), true)
	changeDocument(pacientes[indiceDocumento].documento)
	indiceDocumento++
	click()
}

async function getData(tabla = 'pacientes') {
	const { data, error } = await _supabase
		.from(tabla)
		.select('*')
		.eq('completado', false)
		.limit(25)
	if (error) console.error('Error obteniendo datos:', error);
	else return data
}

async function updateData() {
	const { data, error } = await _supabase
		.from('pacientes')
		.update({ completado: true })
		.eq('id', pacientes[indiceDocumento-1].id) // Cambia 'id' y valor_id según tu tabla y registro
	if (error) console.error('Error actualizando datos:', error)
	else console.log('Datos actualizados:')
}

async function insertData() {
	const { data, error } = await _supabase
		.from('laboratorios')
		.insert(n_filas)
	if (error) {console.error('Error insertando datos:', error)}
	else console.log('Datos insertados:')
}


/*
const script = document.createElement('script');
script.src = 'http://127.0.0.1:5500/Lab%20scrappnig.js';
script.onload = () => console.log('Lab scrapping añadido exitosamente');
document.head.appendChild(script);

const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js';
script.onload = () => console.log('Axios añadido exitosamente');
document.head.appendChild(script);
*/
