var con = require("./connection");
var express = require('express');
var app = express();
const cors = require('cors');
const session = require('express-session');
var bodyParser = require('body-parser');
const { calculateDistance, deg2rad, fetchAndCalculateDistance } = require('./model.js');

// Enable CORS for all routes
app.use(session({
  secret: 'youet_key',
  resave: false,
  saveUninitialized: true
}));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.json()); 


// app.post('/signin', (req, res) => {

//   var email = req.body.email;
//   var password = req.body.password;
//   var userId = req.body.userId;
//   console.log(req.body);

//   // res.status(500).json({ success: false, message: 'Login failed' })

//   if (!email || !password) {
//       return res.status(400).json({ error: 'Email and password are required' });
//   }

//   // Check credentials against the database
//   var sql = 'SELECT uid FROM user_details WHERE uemail = ? AND upasword = ?';
//   con.query(sql, [email, password], (err, results) => {
//       if (err) {
//           console.error('MySQL query error:', err);
//           return res.status(500).json({ error: 'Internal server error' });
//       }

//       if (results.length === 1) {
//            userId = results[0].uid;
//            req.session.userId = userId;
//           res.json({ userId });
//           console.log(userId)
//           //res.json({ message: 'Login successful' });
//       } else {

//           res.status(401).json({ error: 'Invalid email or password' });
//       }
//   });
// });


app.post('/signin', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const sql = 'SELECT uid FROM user_details WHERE uemail = ? AND upasword = ?';
  con.query(sql, [email, password], (err, results) => {
    if (err) {
      console.error('MySQL query error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results.length === 1) {
      const userId = results[0].uid;
      req.session.userId = userId;
      return res.json({ userId });
    }

    return res.status(401).json({ error: 'Invalid email or password' });
  });
});


app.post('/signup', (req, res) => {
    var name = req.body.name;
    var email = req.body.email;
    var lastName = req.body.lastName;
    var password = req.body.password;
    console.log(req.body);

    var sql = "INSERT INTO user_details(uname, ulastName, uemail, upasword) VALUES (?, ?, ?, ?)";
    con.query(sql, [name, lastName, email, password], (error, result) => {
        if (error) {
            console.log(error)
            return res.status(500).json({ success: false, message: 'Registration failed' });
        }

        res.send('Inserted');
    });
});
app.post('/location', (req, res) => {
  var latitude = req.body.latitude;
  var longitude = req.body.longitude;
  var user = req.body.user;
  const userId = req.session.userId;
  console.log(req.body);
  console.log(userId);

  var sql = "INSERT INTO coordinates(latitude, longitude,uid) VALUES (?, ?,?)";
  con.query(sql, [latitude, longitude,user], (error, result) => {
      if (error) {
          console.log(error)
          return res.status(500).json({ success: false, message: 'Insertion failed' });
      }

      res.send('Inserted');
  });
});

// app.post('/userinterest', (req, res) => {
//     try {
//       const districtName = req.body.location;
//       const days = req.body.days;
//       var interest = req.body.interests;
//        const userId = 1;
//        console.log(userId)
  
//  // Define the INSERT query without the tourId column
//  const insertQuery = `INSERT INTO TourPlans (UserID, DayNumber,LocationID) VALUES (?, ?)`;

//  // Execute the query
//  con.query(insertQuery, [userId, days,districtName], (insertErr, result) => {
//      if (insertErr) {
//          console.error('Error inserting into TourPlans:', insertErr);
//          res.status(500).json({ success: false, message: 'Internal server error' });
//      } else {
//          // If insertion is successful, retrieve the auto-generated tourId
//          const tourId = result.insertId;
//          console.log('Inserted tourId:', tourId);
//          req.session.tourId = tourId;

//          // Call function to fetch and calculate distances
//          fetchAndCalculateDistance(tourId, interest, districtName, days, userId, (err, sortedPlaces) => {
//              if (err) {
//                  console.error('Error fetching places:', err);
//                  res.status(500).json({ success: false, message: 'Internal server error' });
//              } else {
//                  res.status(200).json({ success: true, sortedPlaces });
//              }
//          });
//      }
//  });

//       // Call function to fetch and calculate distances
//       // fetchAndCalculateDistance(tourId,interest,districtName, days,userId, (err, sortedPlaces) => {
//       //   if (err) {
//       //     console.error('Error fetching places:', error);
//       //     res.status(500).json({ success: false, message: 'Internal server error' });
//       //   } else {
//       //     res.status(200).json({ success: true, sortedPlaces });
//       //   }
//       // });

//     } catch (error) {
//       console.error('Error fetching places:', error);
//       res.status(500).json({ success: false, message: 'Internal server error' });
//     }
//   });

app.post('/createSchedule', (req, res) => {
  try {
      const districtName = req.body.location;
      const days = req.body.days;
      const interest = req.body.interests;
      const userId = 1; // Assuming userId is fixed or retrieved from the session

      // Define the query to fetch DistrictID based on districtName from Districts table
      const selectQuery = `SELECT DistrictID FROM Districts WHERE DistrictName = ?`;

      // Execute the query to fetch DistrictID
      con.query(selectQuery, [districtName], (selectErr, selectResult) => {
          if (selectErr) {
              console.error('Error fetching DistrictID from Districts:', selectErr);
              res.status(500).json({ success: false, message: 'Internal server error' });
          } else {
              if (selectResult.length === 0) {
                  // Handle case where districtName doesn't exist in Districts table
                  console.error(`District '${districtName}' not found in Districts table.`);
                  res.status(404).json({ success: false, message: 'District not found' });
              } else {
                  const districtId = selectResult[0].DistrictID;
                  console.log(`District '${districtName}' found with ID '${districtId}' in Districts table.`);

                  // Define the INSERT query into TourPlans
                  const insertQuery = `INSERT INTO TourPlans (UserID, DayNumber, LocationID) VALUES (?, ?, ?)`;

                  // Execute the INSERT query
                  con.query(insertQuery, [userId, days, districtId], (insertErr, result) => {
                      if (insertErr) {
                          console.error('Error inserting into TourPlans:', insertErr);
                          res.status(500).json({ success: false, message: 'Internal server error' });
                      } else {
                          // If insertion is successful, retrieve the auto-generated tourId
                          const tourId = result.insertId;
                          console.log('Inserted tourId:', tourId);
                          req.session.tourId = tourId;

                          // Call function to fetch and calculate distances
                          fetchAndCalculateDistance(tourId, interest, districtName, days, userId, (err, sortedPlaces) => {
                              if (err) {
                                  console.error('Error fetching places:', err);
                                  res.status(500).json({ success: false, message: 'Internal server error' });
                              } else {
                                  res.status(200).json({ success: true, sortedPlaces });
                              }
                          });
                      }
                  });
              }
          }
      });

  } catch (error) {
      console.error('Error processing request:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
});





app.get('/tourSchedules', (req, res) => {
  const tourId = 1;
  const sql = 'SELECT places.loc_id, places.location, places.time,places.category,TourSchedule.distance,TourSchedule.tourId,TourSchedule.Time,TourSchedule.schedule_id FROM TourSchedule INNER JOIN places ON TourSchedule.loc_id = places.loc_id WHERE TourSchedule.tourId = ?';
  
  // 'SELECT distance FROM TourSchedule where tourId=1';

  con.query(sql,[tourId], (err, result) => {
    if (err) {
      console.error('Error fetching tour schedules:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.json(result);
      // console.log(tourId)
    }
  });
});
app.get('/scheduleHistory', (req, res) => {
 
  const userId= 1;
  const sql = 'SELECT * FROM TourPlans where UserID=?';
  
  // 'SELECT distance FROM TourSchedule where tourId=1';

  con.query(sql, [userId],(err, result) => {
    if (err) {
      console.error('Error fetching tour schedules:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.json(result);
      //console.log(result)
    }
  });
});
app.get('/editSchedules', (req, res) => {
      var sql = "DELETE FROM TourSchedule WHERE schedule_id=?";
      // var id = req.query.uid;
      con.query(sql,[id], (error, result) => {
          if (error) {
              console.log(error);
              return res.status(500).json({ success: false, message: 'Failed to delete user details' });
          }
          res.redirect('/editSchedules');
      });
  });
  app.get('/deleteSchedules', (req, res) => {
    var sql = "DELETE FROM TourSchedule WHERE tourId=1";
    // var id = req.query.uid;
    con.query(sql, (error, result) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ success: false, message: 'Failed to delete user details' });
        }
        res.redirect('/deleteSchedules');
    });
});
app.get('/socialMedia', (req, res) => {

  const sql = 'SELECT * FROM final1';
  
  // 'SELECT distance FROM TourSchedule where tourId=1';

  con.query(sql,(err, result) => {
    if (err) {
      console.error('Error fetching tour schedules:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.json(result);
      //console.log(result)
    }
  });
});
   

// app.get('/user_details', (req, res) => {
//     var sql = "SELECT * FROM user_details";
//     con.query(sql, (error, result) => {
//         if (error) {
//             console.log(error);
//             return res.status(500).json({ success: false, message: 'Failed to fetch user details' });
//         }
//         res.render(__dirname + "/user_details", { user_details: result });
//     });
// });

// app.get('/delete-user_details', (req, res) => {
//     var sql = "DELETE FROM user_details WHERE uid=?";
//     var id = req.query.uid;
//     con.query(sql, [id], (error, result) => {
//         if (error) {
//             console.log(error);
//             return res.status(500).json({ success: false, message: 'Failed to delete user details' });
//         }
//         res.redirect('/user_details');
//     });
// });

// app.get('/update-user_details', (req, res) => {
//     var sql = "SELECT * FROM user_details WHERE uid=?";
//     var id = req.query.uid;
//     con.query(sql, [id], (error, result) => {
//         if (error) {
//             console.log(error);
//             return res.status(500).json({ success: false, message: 'Failed to fetch user details for update' });
//         }
//         res.render(__dirname + "/update_user", { user_details: result });
//     });
// });

// app.post('/update-user_details', (req, res) => {
//     var name = req.body.name;
//     var email = req.body.email;
//     var id = req.body.id;

//     var sql = "UPDATE user_details SET uname=?, uemail=? WHERE uid=?";
//     con.query(sql, [name, email, id], (error, result) => {
//         if (error) {
//             console.log(error);
//             return res.status(500).json({ success: false, message: 'Failed to update user details' });
//         }
//         res.redirect('/user_details');
//     });
// });

app.listen(4000, () => {
    console.log('Server is running on port 4000');
});
