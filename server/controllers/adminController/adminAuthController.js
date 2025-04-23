const Admin = require('../../models/admin/adminModel'); 
const bcrypt = require('bcrypt'); 
const User = require('../../models/user/userModel'); 
const Order=require('../../models/user/orderMoel')
const Product=require('../../models/admin/productModel')
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');


const adminLoginPage = async (req, res) => {
    res.render('admin/adminLogin');
};


const admindashboard = async (req, res) => {
  try {
        // top-selling Products
    const topProducts = await Order.aggregate([
      { $unwind: "$productItems" },
      {
          $group: {
              _id: "$productItems.productId",
              totalSales: { $sum: "$productItems.quantity" }, 
          },
      },
      { $sort: { totalSales: -1 } }, 
      { $limit: 10 }, 
      {
          $lookup: {
              from: "products", 
              localField: "_id",
              foreignField: "_id", 
              as: "productDetails",
          },
      },
      { $unwind: "$productDetails" }, 
      {
          $project: {
              _id: 1,
              totalSales: 1,
              productName: "$productDetails.productName",
              productImage: "$productDetails.image",
              productPrice: "$productDetails.price",
          },
      },
  ]);
  

    // top-selling categories
    const topCategories = await Order.aggregate([
      { $unwind: "$productItems" },
      {
        $lookup: {
          from: "products",
          localField: "productItems.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$productDetails.category",
          totalSales: { $sum: "$productItems.quantity" },
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      { $unwind: "$categoryDetails" },
      {
        $project: {
          _id: 1,
          totalSales: 1,
          categoryName: "$categoryDetails.name",
        },
      },
    ]);

     res.render('admin/adminIndex', {
      topProducts,
      topCategories,
      
    });
    return;
  } catch (error) {
    console.error('Error loading dashboard:', error);
    res.status(500).send('Internal Server Error');
  }
};



const admin='admin@gmail.com'
const adminPassword='1234'

const adminHome = async (req, res) => {
    const { email, password } = req.body;


    
    const fieldErrors = {};
    if (!email || !password) {
        if (!email) fieldErrors.email = 'Please enter a valid email.';
        if (!password) fieldErrors.password = 'Please enter your password.';
        return res.status(400).json({ fieldErrors })
    }

    try {

        if (email===admin&&password===adminPassword) {
            req.session.admin=true;
            res.status(200).json({ redirectUrl: '/admin/dashboard' });
        }
    } catch (error) {
        console.error('Error during admin login:', error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
};
const getUsersList = async (req, res) => {
    try {
        const limit = 5;
        const page = parseInt(req.query.page) || 1;

        const totalUsers = await User.countDocuments();
        const totalPages = Math.ceil(totalUsers / limit);

        const users = await User.find()
            .skip((page - 1) * limit) 
            .limit(limit);

        res.render('admin/usersList', { 
            users, 
            currentPage: page, 
            totalPages 
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Server Error');
    }
};


const changeStatus = async (req, res) => {
    const { userId } = req.params;
    const { status } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.status = status;  

        await user.save(); 

        res.status(200).json({ success: true, status: user.status });
    } catch (error) {
        console.error('Error changing user status:', error);
        res.status(500).json({ message: 'Failed to change user status' });
    }
};


const adminLogout=async (req,res) => {
    req.session.destroy()
    res.redirect('/admin/adminLoginPage')
}
const generateReport = async (req, res) => {
    try {
      const { reportType, startDate, endDate, downloadFormat } = req.body;
  
      let dateFilter = {};
      const now = new Date();
  
      switch (reportType) {
        case 'daily':
          dateFilter = {
            createdAt: {
              $gte: new Date(now.setHours(0, 0, 0, 0)),
              $lte: new Date(now.setHours(23, 59, 59, 999)),
            },
          };
          break;
        case 'weekly':
          const startOfWeek = new Date();
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);
          dateFilter = {
            createdAt: {
              $gte: startOfWeek,
              $lte: endOfWeek,
            },
          };
          break;
        case 'yearly':
          dateFilter = {
            createdAt: {
              $gte: new Date(now.getFullYear(), 0, 1),
              $lte: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
            },
          };
          break;
        case 'custom':
          if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start and end dates are required for custom range' });
          }
          dateFilter = {
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
            },
          };
          break;
        default:
          return res.status(400).json({ error: 'Invalid report type' });
      }
  
      // Aggregation pipeline for report data
      const pipeline = [
        { $match: dateFilter },
        { $unwind: '$productItems' },
        {
          $group: {
            _id: {
              reportType: reportType === 'daily' ? '$productItems.productId' : reportType === 'weekly' ? { $dayOfWeek: '$createdAt' } : reportType === 'yearly' ? { $month: '$createdAt' } : '$productItems.productId',
              productId: '$productItems.productId',
            },
            totalSales: { $sum: '$productItems.quantity' },
            totalPrice: { $sum: '$productItems.total' },
          },
        },
        {
          $addFields: {
            productId: { $toObjectId: '$_id.productId' },
          },
        },
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'productDetails',
          },
        },
        { $unwind: { path: '$productDetails', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            productName: '$productDetails.name',
            totalSales: 1,
            totalPrice: 1,
            date: reportType === 'weekly' ? {
              $let: {
                vars: {
                  days: ['', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                },
                in: { $arrayElemAt: ['$$days', '$_id.reportType'] },
              },
            } : reportType === 'yearly' ? {
              $let: {
                vars: {
                  months: ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                },
                in: { $arrayElemAt: ['$$months', '$_id.reportType'] },
              },
            } : null,
          },
        },
        { $sort: reportType === 'daily' || reportType === 'custom' ? { totalSales: -1 } : { date: 1 } },
      ];
  
      const reportData = await Order.aggregate(pipeline);
  
      if (!reportData.length) {
        return res.status(404).json({ error: 'No data found for the selected period' });
      }
  
      // Calculate summary metrics
      const totalOrders = await Order.countDocuments(dateFilter);
      const totalItemsSold = reportData.reduce((sum, item) => sum + item.totalSales, 0);
      const totalSales = reportData.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  
      if (downloadFormat === 'pdf') {
        const doc = new PDFDocument();
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          res.setHeader('Content-Disposition', `attachment; filename="sales_report_${reportType}_${Date.now()}.pdf"`);
          res.setHeader('Content-Type', 'application/pdf');
          res.send(pdfData);
        });
  
        // PDF Content
        doc.fontSize(20).text(`Sales Report - ${reportType}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Period: ${reportType === 'custom' ? `${startDate} to ${endDate}` : reportType}`);
        doc.text(`Total Orders: ${totalOrders}`);
        doc.text(`Total Items Sold: ${totalItemsSold}`);
        doc.text(`Total Sales: ₹${totalSales.toFixed(2)}`);
        doc.moveDown();
  
        // Report Details
        doc.text('Report Details:', { underline: true });
        reportData.forEach((item, index) => {
          doc.moveDown(0.5);
          doc.text(`Item #${index + 1}`);
          doc.text(`Product: ${item.productName || 'Unknown'}`);
          if (item.date) {
            doc.text(`Period: ${item.date}`);
          }
          doc.text(`Quantity Sold: ${item.totalSales}`);
          doc.text(`Total Price: ₹${item.totalPrice.toFixed(2)}`);
        });
  
        doc.end();
      } else if (downloadFormat === 'excel') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');
  
        // Add headers
        worksheet.columns = [
          { header: 'Product Name', key: 'productName', width: 25 },
          { header: 'Period', key: 'period', width: 15 },
          { header: 'Quantity Sold', key: 'totalSales', width: 15 },
          { header: 'Total Price', key: 'totalPrice', width: 15 },
        ];
  
        // Add summary
        worksheet.addRow(['Summary']);
        worksheet.addRow(['Total Orders', totalOrders]);
        worksheet.addRow(['Total Items Sold', totalItemsSold]);
        worksheet.addRow(['Total Sales', `₹${totalSales.toFixed(2)}`]);
        worksheet.addRow([]);
  
        // Add report data
        reportData.forEach(item => {
          worksheet.addRow({
            productName: item.productName || 'Unknown',
            period: item.date || (reportType === 'daily' || reportType === 'custom' ? 'N/A' : ''),
            totalSales: item.totalSales,
            totalPrice: `₹${item.totalPrice.toFixed(2)}`,
          });
        });
  
        // Generate Excel file
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="sales_report_${reportType}_${Date.now()}.xlsx"`
        );
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        await workbook.xlsx.write(res);
        res.end();
      } else {
        return res.status(400).json({ error: 'Invalid download format' });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

module.exports = {
    adminLoginPage,
    admindashboard,
    adminHome,
    getUsersList,
    changeStatus,
    adminLogout,
    generateReport
};
