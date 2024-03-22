const User=require('./userModel')
const bcrypt = require('bcryptjs')


//SIGNUP
exports.signup =async(req,res) => {
    try{
        const{firstname,lastname,username, email, password, confirmPassword} = req.body;
        const userExist = await User.findOne({email:email})

        if(userExist){
            return res.status(400).json('email already exist')
        }

        const userCreated= await User.create({
            firstname,
            lastname,
            username, 
            email, 
            password,
            confirmPassword
        })
            
        res.status(200).json({
            msg:userCreated,
            token: await userCreated.generateToken(),
            userId: userCreated._id.toString()
        })
    }
    catch(error){
        console.log(error)
        res.status(500).json('Error Bro')
    }
}


//LOGIN
exports.login =async(req, res) => {
    try{
        const {email, password}=req.body
        const userExist = await User.findOne({email})

        if(!userExist){
            return res.status(400).json('Invalid Credentials')
        }

        const user = await bcrypt.compare(password, userExist.password)
        if(user){
            res.status(200).json({
                msg:"Login successful",
                token: await userExist.generateToken(),
                userId: userExist._id.toString()
            })
        }
        else{
            res.status(400).json({message:'Invalid Credentials'})
        }
    }
    catch(error){
        console.log(error)
        res.status(500).json('Error Bro')
    }
}
