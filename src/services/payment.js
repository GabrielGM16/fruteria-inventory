export const procesarPagoTarjeta = async (tarjeta, monto) => {
  try {
    const response = await fetch('http://localhost:3001/api/pagos/tarjeta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        numero_tarjeta: tarjeta.numero,
        nombre_titular: tarjeta.nombre,
        expiracion: tarjeta.expiracion,
        cvv: tarjeta.cvv,
        monto: monto
      })
    });

    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        referencia: data.referencia,
        autorizacion: data.autorizacion
      };
    } else {
      throw new Error(data.mensaje);
    }
  } catch (error) {
    console.error('Error procesando pago:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const validarTarjeta = (numero) => {
  const regex = /^[0-9]{16}$/;
  return regex.test(numero.replace(/\s/g, ''));
};

export const validarCVV = (cvv) => {
  const regex = /^[0-9]{3,4}$/;
  return regex.test(cvv);
};