// Script para probar la conexión a la API
// Ejecutar en la consola del navegador

async function testConnection() {
    console.log('🚀 Probando conexión con la API...');
    
    try {
        // Probar conexión básica
        const response = await fetch('http://localhost:8080/dentists');
        
        if (response.ok) {
            const dentists = await response.json();
            console.log('✅ Conexión exitosa!');
            console.log(`📊 Dentistas encontrados: ${dentists.length}`);
            console.log('👥 Datos:', dentists);
            
            // Probar crear un dentista de prueba
            const testDentist = {
                registrationNumber: 12345,
                name: "Dr. Test",
                lastName: "Conexión"
            };
            
            console.log('🧪 Creando dentista de prueba...');
            const createResponse = await fetch('http://localhost:8080/dentists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testDentist)
            });
            
            if (createResponse.ok) {
                const newDentist = await createResponse.json();
                console.log('✅ Dentista creado exitosamente!');
                console.log('🆔 ID asignado:', newDentist.id);
                
                // Listar dentistas nuevamente
                const updatedResponse = await fetch('http://localhost:8080/dentists');
                const updatedDentists = await updatedResponse.json();
                console.log(`📊 Total de dentistas ahora: ${updatedDentists.length}`);
                
                return {
                    status: 'success',
                    message: 'Conexión y CRUD funcionando correctamente',
                    totalDentists: updatedDentists.length,
                    testDentistId: newDentist.id
                };
            } else {
                throw new Error(`Error al crear dentista: ${createResponse.status}`);
            }
        } else {
            throw new Error(`Error de conexión: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        console.log('💡 Soluciones posibles:');
        console.log('   1. Verificar que el backend esté corriendo en puerto 8080');
        console.log('   2. Ejecutar: cd backend && ./mvnw.cmd spring-boot:run');
        console.log('   3. Verificar que no haya conflictos de puerto');
        
        return {
            status: 'error',
            message: error.message,
            solutions: [
                'Verificar que el backend esté corriendo',
                'Comprobar la configuración CORS',
                'Revisar los logs del servidor'
            ]
        };
    }
}

// Función para limpiar datos de prueba
async function cleanTestData() {
    try {
        const response = await fetch('http://localhost:8080/dentists');
        const dentists = await response.json();
        
        const testDentists = dentists.filter(d => 
            d.name === 'Dr. Test' && d.lastName === 'Conexión'
        );
        
        for (const dentist of testDentists) {
            await fetch(`http://localhost:8080/dentists/${dentist.id}`, {
                method: 'DELETE'
            });
            console.log(`🗑️ Dentista de prueba eliminado: ID ${dentist.id}`);
        }
        
        console.log('✅ Datos de prueba limpiados');
    } catch (error) {
        console.error('❌ Error al limpiar datos:', error);
    }
}

// Exportar funciones para uso
window.testConnection = testConnection;
window.cleanTestData = cleanTestData;

console.log('🔧 Funciones de prueba cargadas:');
console.log('   - testConnection(): Probar conexión y CRUD');
console.log('   - cleanTestData(): Limpiar datos de prueba');
