const express=require('express');
const path=require('path')
const app=express();
const hbs=require('hbs');
const bcrypt=require('bcryptjs');
const nodemailer = require('nodemailer');
const multer  = require('multer');
const session = require('express-session');
require('dotenv').config();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads')
    },
    filename: function (req, file, cb) {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
});


// Configure session middleware
app.use(session({
    secret: 'harekrishnaharekrishnakrishnakrishnahareharehareramhareramharehare', // Change this to a random secret key
    resave: false,
    saveUninitialized: false,
}));

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        // User is authenticated
        next();
    } else {
        // User is not authenticated
        res.render('/login'); // Redirect to login page
    }
};
  
const upload = multer({ storage: storage })
app.use(express.static('uploads'));
require('./src/db/conn');
const Register=require("./src/models/register")
const Product = require("./src/models/product");

const port = process.env.PORT || 3000;

const static_path=path.join(__dirname,"./public");
const temp_path=path.join(__dirname,"./templates/views");
const partials_path=path.join(__dirname,"./templates/partials");

// vo to req.body ke liye
app.use(express.json());
app.use(express.urlencoded({extended:false}));

app.use(express.static(static_path));
app.set("view engine", "hbs")
app.use('/uploads', express.static('uploads'));
// ye hmne views ko template ke andar dala esiliye kiya
app.set('views',temp_path);
// ye partials ka use kr rhe hai esiliye kiya
hbs.registerPartials(partials_path)

app.get('/',(req,res)=>{
    res.render("home");
});

app.get('/addProduct',(req,res)=>{
    res.render("addProduct");
});

// Backend route to display user's posted products
// Backend route to display user's posted products
app.get('/myProducts', requireAuth, async (req, res) => {
    try {
        // console.log("in my product" + req.session.username)
        const userId = req.session.userId; // Get user ID from session
        const userProducts = await Product.find({ userId: userId });
        // console.log("userproduct" + userProducts );
        // console.log(userProducts);
        // console.log(userProducts.productImage);
        res.render('myProducts', { products: userProducts });
    } catch (error) {
        console.error('Error fetching user products:', error);
        res.status(500).send('Error fetching user products. Please try again later.');
    }
});

app.get("/login", (req, res) => {
    res.render('login');
});

app.get("/register", (req, res) => {
    res.render('register');
});

// Logout route
app.get('/logout', async (req, res) => {
    try {
        // Clear the authentication state for the user
        // For example, if you are using JWT tokens for authentication,
        // you can clear the token stored in the client-side cookie or local storage
        // Here, I'll provide an example assuming you're using JWT tokens

        // Clear the token from the client-side cookie or local storage
        res.clearCookie('jwt_token'); // Clear the cookie storing the JWT token
        // const isAuthenticated = false;
        // Redirect the user to the login page or any other appropriate page after logout
        res.render('home');
    } catch (error) {
        console.error('Error logging out:', error);
        res.status(500).send('Error logging out. Please try again later.');
    }
});


// Login Check
app.post('/login',async(req,res)=>{
    try{
        const username=req.body.username;
        const password=req.body.password;
        const user=await Register.findOne({username:username});

        const isMatch= await bcrypt.compare(password,user.password);
        
        const token=await user.generateAuthToken();

        if(isMatch){
             // Set user ID in session
            req.session.userId = user._id;
            const isAuthenticated = true;
            res.status(201).render("home", { username: username ,isAuthenticated});
        }else{
            res.send("invalid login details");
        }
    }catch(error){
        res.status(400).send('invalid login details');
    }
});

// create a new user in our DB
app.post("/register", async(req,res)=>{
    try{
        const registerUserDetails=new Register({
            username:req.body.username,
            email:req.body.email,
            password:req.body.password
        });
        const token=await registerUserDetails.generateAuthToken();
        const reg=await registerUserDetails.save();
        res.status(201).render('home');
    } catch(error){
        res.status(400).send(error);
    }
});

// product add
app.post('/addProduct', requireAuth,upload.single('productImage'), async (req, res) => {
    try {
        // Log form data and uploaded file
        console.log(req.body);
        console.log(req.file);

        // Create a new product instance
        const product = new Product({
            productName: req.body.productName,
            productDescription: req.body.productDescription,
            productPrice: req.body.productPrice,
            productCategory: req.body.productCategory,
            productImage: req.file.path,
            userId: req.session.userId // Assuming you're storing file path in the database
        });

        // Save product to the database
        await product.save();

        // Redirect or send response as needed
        res.status(201).redirect('/myProducts');
        // res.status(201).redirect('/');
    } catch (error) {
        // Handle errors
        console.error('Error adding product:', error);
        res.status(500).send('Error adding product. Please try again later.');
    }
});

// search product
app.get('/search', async (req, res) => {
    try {
        const category = req.query.category;
        const searchQuery = req.query.search;

        let query = { productCategory: category };

        // You can customize the search query based on additional criteria, such as product name, description, etc.
        if (searchQuery) {
            query.$or = [
                { productName: { $regex: searchQuery, $options: 'i' } }, // Case-insensitive search for product name
                { productDescription: { $regex: searchQuery, $options: 'i' } } // Case-insensitive search for product description
            ];
        }

        // Retrieve products based on the search query
        const products = await Product.find(query);

        // Render the search results page with the retrieved products
        res.render('searchResults', { products: products });
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).send('Error searching products. Please try again later.');
    }
});

// Route to send email to product owner
// app.post('/contactOwner', requireAuth, async (req, res) => {
//     try {
//         const { ownerEmail, ownerName, message } = req.body;

//         // Create a nodemailer transporter
//         const transporter = nodemailer.createTransport({
//             service: 'gmail',
//             auth: {
//                 user: 'your-email@gmail.com', // Your email address
//                 pass: 'your-password' // Your email password
//             }
//         });

//         // Setup email data
//         const mailOptions = {
//             from: 'your-email@gmail.com', // Your email address
//             to: ownerEmail, // Owner's email address
//             subject: 'Message from GradCaRt',
//             text: `Hi ${ownerName},\n\nYou have a new message from a user regarding your product:\n\n${message}`
//         };

//         // Send email
//         transporter.sendMail(mailOptions, (error, info) => {
//             if (error) {
//                 console.error('Error sending email:', error);
//                 res.status(500).send('Error sending email. Please try again later.');
//             } else {
//                 console.log('Email sent:', info.response);
//                 res.status(200).send('Email sent successfully.');
//             }
//         });
//     } catch (error) {
//         console.error('Error contacting owner:', error);
//         res.status(500).send('Error contacting owner. Please try again later.');
//     }
// });


// search route
app.get('/search', async (req, res) => {
    try {
        console.log('hii');
        const category = req.query.category;
        const searchQuery = req.query.search;

        let query = { productCategory: category };

        // You can customize the search query based on additional criteria, such as product name, description, etc.
        if (searchQuery) {
            query.$or = [
                { productName: { $regex: searchQuery, $options: 'i' } }, // Case-insensitive search for product name
                { productDescription: { $regex: searchQuery, $options: 'i' } } // Case-insensitive search for product description
            ];
        }

        // Retrieve products based on the search query
        const products = await Product.find(query);

        // Fetch owner details (email) for each product
        for (const product of products) {
            const owner = await Register.findOne({ username: product.username });
            product.ownerEmail = owner.email;
            product.ownerName = owner.username;
        }

        // Render the search results page with the retrieved products
        res.render('searchResults', { products: products });
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).send('Error searching products. Please try again later.');
    }
});


app.listen(port,()=>{
    console.log(`server is running at port ${port}`);
});