const User=require('../../models/user/userModel')
const Order=require('../../models/user/orderMoel')
const Wallet=require('../../models/user/walletModel')


const walletPage = async (req, res) => {
    try {
        const userId = req.session.user?.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            console.log('wallet page ')
            let walletDetails ={ 
                userId, 
                total: 0, 
                returnAmount: 0, 
                canceledAmount: 0, 
                walletEntries: [] 
            }
           let newWallet = await Wallet.create(walletDetails)
            console.log('new wallet create',newWallet)
            return res.render('user/walletPage',{ 
                user, 
                total: 0, 
                returnAmount: 0, 
                canceledAmount: 0, 
                walletEntries: [] 
            } );
        }

        let total = wallet.balance;
        let returnAmount = 0;
        let canceledAmount = 0;

        wallet.transaction.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        wallet.transaction.forEach(entry => {
            if (entry.type === 'Credit') {
                if (entry.description.toLowerCase().includes('returned')) {
                    returnAmount += entry.amount;
                } else if (entry.description.toLowerCase().includes('canceled')) {
                    canceledAmount += entry.amount;
                }
            }
        });

        res.render('user/walletPage', { 
            user, 
            total, 
            returnAmount, 
            canceledAmount, 
            walletEntries: wallet.transaction 
        });

    } catch (error) {
        console.error('Error displaying wallet page:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


module.exports = {
    walletPage
};