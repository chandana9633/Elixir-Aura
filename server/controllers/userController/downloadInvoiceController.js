const Order=require('../../models/user/orderMoel')
const PDFDocument =require('pdfkit')

const downloadInvoice = async (req, res) => {
    try {
        const { orderId } = req.params;
        console.log('Received request to download invoice for order:', orderId);

        const order = await Order.findById(orderId)
            .populate('userId')
            .populate('productItems.productId');

        if (!order) {
            console.error('Order not found:', orderId);
            return res.status(404).json({ error: 'Order not found' });
        }

        const PDFDocument = require('pdfkit');

        const doc = new PDFDocument({
            margin: 50,
            size: 'A4'
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice_${orderId}.pdf`);

        doc.pipe(res);

        const formatCurrency = (amount) => amount?.toFixed(2) || '0.00';
        const formatText = (text) => text || 'N/A';

        const drawLine = (startX, startY, endX, endY) => {
            doc.moveTo(startX, startY).lineTo(endX, endY).stroke();
        };

   
        doc
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('Elixir Aura', 50, 50);

        doc
            .fontSize(10)
            .font('Helvetica')
            .text('123 Serenity Street,', 50, 70)
            .text('Bangalore, Karnataka - 560001', 50, 85)
            .text('GSTIN: 29ABCDE1234F1Z5', 50, 100);

        drawLine(50, 115, 560, 115); 


        doc.fontSize(24).text('INVOICE', 50, 130, { align: 'center' });
        doc.fontSize(12).text(`Invoice #${orderId}`, { align: 'center' });
        doc.moveDown();

        const rightColumnX = 300;
        doc.fontSize(10);

        doc.text('Bill To:', 50, 180);
        doc.text(formatText(order.userName), 50, 195);

        if (order.billingAddress && order.billingAddress.length > 0) {
            const address = order.billingAddress[0];
            doc.text([
                formatText(address.street),
                formatText(address.city),
                formatText(address.country)
            ].join(', '), 50, 210, { width: 200 });
        }

        doc.text(`Email: ${formatText(order.userId?.email)}`, 50, 240);

        doc.text(`Date: ${new Date().toLocaleDateString()}`, rightColumnX, 180);
        doc.text(`Order #: ${orderId}`, rightColumnX, 195);
        doc.text(`Payment: ${formatText(order.paymentMethod)}`, rightColumnX, 210);

  
        const tableTop = 280;
        const tableWidth = 510;
        const columns = {
            item: { x: 50, width: 240 },
            qty: { x: 290, width: 70 },
            price: { x: 360, width: 100 },
            total: { x: 460, width: 100 }
        };

        doc.fillColor('#000000').rect(50, tableTop, tableWidth, 20).fill();
        doc.fillColor('#FFFFFF');
        doc.text('Item Description', columns.item.x + 5, tableTop + 5, { width: columns.item.width });
        doc.text('Qty', columns.qty.x + 5, tableTop + 5, { width: columns.qty.width });
        doc.text('Price', columns.price.x + 5, tableTop + 5, { width: columns.price.width });
        doc.text('Total', columns.total.x + 5, tableTop + 5, { width: columns.total.width });

        doc.fillColor('#000000');
        let itemY = tableTop + 30;

        const activeProductItems = (order.productItems || []).filter(item => item.status !== 'Cancelled');

        activeProductItems.forEach(item => {
            doc.text(formatText(item.productName), columns.item.x + 5, itemY);
            doc.text(item.quantity?.toString() || '0', columns.qty.x + 5, itemY);
            doc.text(formatCurrency(item.offerPrice), columns.price.x + 5, itemY);
            doc.text(formatCurrency(item.quantity * item.offerPrice), columns.total.x + 5, itemY);
            itemY += 20;
        });

        const tableBottom = itemY;
        Object.values(columns).forEach(col => {
            drawLine(col.x, tableTop, col.x, tableBottom);
        });
        drawLine(columns.total.x + columns.total.width, tableTop, columns.total.x + columns.total.width, tableBottom);
        drawLine(50, tableTop, 560, tableTop);
        drawLine(50, tableBottom, 560, tableBottom);

        const totalsStartY = tableBottom + 20;
        const totalsX = 380;

        doc.text(`Original Price: ${formatCurrency(order.originalPrice)}`, totalsX, totalsStartY);
        doc.text(`Discount: ${formatCurrency(order.discount)}`, totalsX, totalsStartY + 20);
        doc.text(`Coupon Discount: ${formatCurrency(order.couponDiscount)}`, totalsX, totalsStartY + 40);
        doc.moveDown();
        doc.fontSize(12).text(`Total Price: ${formatCurrency(order.totalPrice)}`, totalsX, totalsStartY + 70);

        doc.fontSize(10).text('Thank you for your business!', 50, 700, { align: 'center' });

        doc.end();
    } catch (error) {
        console.error('Error generating invoice:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};


module.exports = {
    downloadInvoice
}