const PDFDocument = require('pdfkit')
const ExcelJS = require('exceljs');
const Order=require('../../models/user/orderMoel')


const salesReport = async (req, res) => {
    try {
        const { reportType, startDate, endDate, downloadFormat } = req.body;
            console.log(reportType,startDate,endDate, downloadFormat,);
            
        if (reportType === 'custom' && new Date(endDate) < new Date(startDate)) {
            return res.status(400).json({ success: false, message: 'End date cannot be before start date.' });
        }

        let query = {};
        const today = new Date();
        if (reportType === 'daily') {
            query = { createdAt: { $gte: today.setHours(0, 0, 0, 0), $lt: today.setHours(23, 59, 59, 999) } };
        } else if (reportType === 'weekly') {
            const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
            query = { createdAt: { $gte: firstDayOfWeek } };
        } else if (reportType === 'custom' && startDate && endDate) {
            query = { createdAt: { $gte: new Date(startDate), $lt: new Date(endDate) } };
        }

        const orders = await Order.find(query).populate('productItems.productId');

        if (!orders.length) {
            return res.status(404).json({ success: false, message: 'No orders found for the selected criteria.' });
        }

        const reportData = orders.flatMap(order =>
            order.productItems.map(item => ({
                userName: order.userName,
                totalQuantity: order.totalQuantity,
                totalPrice: order.totalPrice,
                discount: order.discount,
                paymentMethod: order.paymentMethod,
                status: order.status,
                orderDate: new Date(order.createdAt).toLocaleDateString(),
                productName: item.productName,
                productQuantity: item.quantity,
                billingAddress: `${order.billingAddress[0].street}, ${order.billingAddress[0].city}, ${order.billingAddress[0].state}, ${order.billingAddress[0].country}`,
            }))
        );

        const overallSalesCount = orders.length;
        const overallOrderAmount = orders.reduce((sum, order) => sum + order.totalPrice, 0);
        const overallDiscount = orders.reduce((sum, order) => sum + order.discount, 0);

        if (downloadFormat === 'pdf') {
            const doc = generatePDF(reportData, overallSalesCount, overallOrderAmount, overallDiscount);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"');
            doc.pipe(res);
        } else if (downloadFormat === 'excel') {
            const buffer = await generateExcel(reportData, overallSalesCount, overallOrderAmount, overallDiscount);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');
            res.send(buffer);
        } else {
            res.status(400).json({ success: false, message: 'Invalid download format.' });
        }
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


const generatePDF = (reportData, salesCount, orderAmount, discount) => {
    const doc = new PDFDocument({
        margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
        }
    });

    doc.fontSize(28)
        .font('Helvetica-Bold')
        .text('Sales Report', {
            align: 'center',
            underline: true
        })
        .moveDown(2);

    const summaryTable = {
        headers: ['Metric', 'Value'],
        rows: [
            ['Overall Sales Count', salesCount],
            ['Total Order Amount', `${orderAmount.toFixed(2)}`],
            ['Total Discount', `${discount.toFixed(2)}`]
        ]
    };

    doc.fontSize(12).font('Helvetica-Bold');
    const summaryStartX = 100;
    let currentY = doc.y;

    const summaryColWidths = [250, 200];

    doc.rect(summaryStartX - 10, currentY - 5, sum(summaryColWidths) + 20, 30)
        .fill('#F5F5F5');

    summaryTable.headers.forEach((header, i) => {
        doc.fill('#000000')
            .text(header,
                summaryStartX + (i * summaryColWidths[0]),
                currentY,
                { width: summaryColWidths[0], align: 'left' }
            );
    });

    doc.font('Helvetica');
    summaryTable.rows.forEach((row, rowIndex) => {
        currentY += 35;
        
        if (rowIndex % 2 === 0) {
            doc.rect(summaryStartX - 10, currentY - 5, sum(summaryColWidths) + 20, 30)
                .fill('#FAFAFA');
        }

        row.forEach((cell, i) => {
            doc.fill('#000000')
                .text(cell.toString(),
                    summaryStartX + (i * summaryColWidths[0]),
                    currentY,
                    { width: summaryColWidths[0], align: i === 1 ? 'right' : 'left' }
                );
        });
    });

    doc.moveDown(3);

    const table = {
        headers: ['User', 'Product', 'Quantity', 'Price', 'Payment', 'Status'],
        rows: reportData.map(data => [
            data.userName,
            data.productName,
            data.productQuantity,
            formatPrice(data.totalPrice),
            data.paymentMethod,
            data.status
        ])
    };

    const colWidths = [100, 180, 60, 90, 80, 90];
    const startX = 70;
    currentY = doc.y;

    doc.fontSize(11).font('Helvetica-Bold');
    doc.rect(startX - 10, currentY - 5, sum(colWidths) + 20, 30)
        .fill('#E8E8E8');

    table.headers.forEach((header, i) => {
        let xPosition = startX;
        for (let j = 0; j < i; j++) {
            xPosition += colWidths[j];
        }
        doc.fill('#000000')
            .text(header,
                xPosition,
                currentY + 7,
                { 
                    width: colWidths[i], 
                    align: header === 'Price' ? 'right' : 'left'
                }
            );
    });

    currentY += 35;
    doc.fontSize(10).font('Helvetica');

    table.rows.forEach((row, rowIndex) => {
        if (rowIndex % 2 === 0) {
            doc.rect(startX - 10, currentY - 5, sum(colWidths) + 20, 30)
                .fill('#F8F8F8');
        }

        row.forEach((cell, i) => {
            let xPosition = startX;
            for (let j = 0; j < i; j++) {
                xPosition += colWidths[j];
            }
            
            if (i === 5) {  
                doc.fill(getStatusColor(cell));
            } else {
                doc.fill('#000000');
            }

            const content = i === 3 ? cell : truncateText(cell.toString(), colWidths[i]);
            const alignment = i === 3 ? 'right' : 'left';

            doc.text(content,
                xPosition,
                currentY,
                { 
                    width: colWidths[i], 
                    align: alignment
                }
            );
        });

        currentY += 30;

        if (currentY > doc.page.height - 70) {
            doc.addPage();
            currentY = 50;
        }
    });

    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8)
            .fill('#666666')
            .text(
                `Page ${i + 1} of ${pages.count} | Generated on ${new Date().toLocaleString()}`,
                50,
                doc.page.height - 50,
                { align: 'center' }
            );
    }

    doc.end();
    return doc;
};

const sum = arr => arr.reduce((a, b) => a + b, 0);

const getStatusColor = status => {
    const colors = {
        'Delivered': '#2E7D32',
        'Pending': '#F57C00',
        'Cancelled': '#C62828',
        'Returned': '#6A1B9A'
    };
    return colors[status] || '#000000';
};

const truncateText = (text, width) => {
    if (text.length * 6 > width) {
        return text.substring(0, Math.floor(width / 6) - 3) + '...';
    }
    return text;
};

const formatPrice = (price) => {
    return `${parseFloat(price).toFixed(2)}`;
};

const generateExcel = async (reportData, salesCount, orderAmount, discount) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    worksheet.columns = [
        { header: 'User Name', key: 'userName', width: 20 },
        { header: 'Product Name', key: 'productName', width: 50 },
        { header: 'Product Quantity', key: 'productQuantity', width: 15 },
        { header: 'Total Price', key: 'totalPrice', width: 15 },
        { header: 'Discount', key: 'discount', width: 15 },
        { header: 'Payment Method', key: 'paymentMethod', width: 20 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Order Date', key: 'orderDate', width: 20 },
        { header: 'Billing Address', key: 'billingAddress', width: 40 },
    ];

    worksheet.addRow({
        userName: 'Overall Summary',
        productName: '',
        productQuantity: '',
        totalPrice: orderAmount,
        discount: discount,
        paymentMethod: '',
        status: '',
        orderDate: '',
        billingAddress: `Total Sales: ${salesCount}`,
    });

    reportData.forEach(data => {
        worksheet.addRow(data);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
};


module.exports = {
    salesReport
};
