const Order=require('../../models/user/orderMoel')
const Product=require('../../models/admin/productModel')

const getDashboardData = async (req, res) => {
  const { filterType } = req.query;
  const now = new Date();
  let matchCondition = {};
  let pipeline = [];

  try {
    if (filterType === 'daily') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      matchCondition = { createdAt: { $gte: start, $lt: end } };

      pipeline = [
        { $match: matchCondition },
        { $unwind: '$productItems' },
        {
          $group: {
            _id: '$productItems.productId',
            totalSales: { $sum: '$productItems.quantity' },
          },
        },
        {
          $addFields: {
            productId: { $toObjectId: '$_id' },
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
          },
        },
        { $sort: { totalSales: -1 } }, 
      ];
    } else if (filterType === 'weekly') {
      const startOfWeek = new Date();
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      matchCondition = { createdAt: { $gte: startOfWeek, $lt: endOfWeek } };

      pipeline = [
        { $match: matchCondition },
        { $unwind: '$productItems' },
        {
          $group: {
            _id: '$productItems.productId', 
            totalSales: { $sum: '$productItems.quantity' },
          },
        },
        {
          $addFields: {
            productId: { $toObjectId: '$_id' },
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
          },
        },
        { $sort: { totalSales: -1 } },
      ];
    } else if (filterType === 'yearly') {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      matchCondition = { createdAt: { $gte: yearStart, $lte: yearEnd } };

      pipeline = [
        { $match: matchCondition },
        { $unwind: '$productItems' },
        {
          $group: {
            _id: '$productItems.productId', 
            totalSales: { $sum: '$productItems.quantity' },
          },
        },
        {
          $addFields: {
            productId: { $toObjectId: '$_id' },
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
          },
        },
        { $sort: { totalSales: -1 } }, 
      ];
    }

    const result = await Order.aggregate(pipeline);
    console.log('dashboard data', result);
    res.json(result);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


module.exports={
    getDashboardData,
}