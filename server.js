const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = 3333;

app.use(express.json());

// Election model schema
  const electionSchema = new mongoose.Schema({
    state: String,
    parties: [String],
    result: {
      APC: Number,
      PDP: Number,
      LP: Number
    },
    collationOffice: String,
    isRigged: Boolean,
    total: Number,
  });
 
  const electionsCollection = mongoose.model('Election', electionSchema);

  // Get all elections
  app.get('/elections', async (req, res) => {
    try {
      const elections = await electionsCollection.find();
      res.json({message: "The available Users are" + elections.length, data:elections});
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // get one election
  app.get("/getone/:id", async(req, res) =>{
    const id = req.params.id;
    const getOne = await electionsCollection.findById(id)
    res.status(200).json(getOne)
  });

  // Add a new election
  app.post('/elections', async (req, res) => {
    const election = req.body;
    try {
      const newResult = await electionsCollection.create(election);
      res.status(201).json(newResult);
    } catch (err) {
      res.status(500).json({ error: 'Failed to add election' });
    }
  });

  //Update an existing election
  app.put("/update/:id", async(req, res) =>{
    try{
        const userId = req.params.id
        const newUser = await electionsCollection.findById(userId);

        const updatedUser = {
          state: req.body.state || newUser.state,
          parties: req.body.parties || newUser.parties,
          result: {
            APC: req.body.result.APC || newUser.result.APC,
            PDP: req.body.result.PDP || newUser.result.PDP,
            LP: req.body.result.LP || newUser.result.LP
          
            }
        }
          await electionsCollection.updateOne(updatedUser);
          if(updatedUser) {
            res.status(200).json(updatedUser);
        } else {
            res.status(400).json( {
                Error: "Error updating newUser."
            })
        }
    } catch (e) {
        res.status(400).json({
            Message: e.message
        })
    }
});
    

  // Delete an election
  app.delete('/elections/:id', async (req, res) => {
    try {
      const electionId = req.params.id;
      const result = await electionsCollection.deleteOne({
       
      });
        if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Election not found' });
      }
      res.json({ message: 'Election deleted successfully' });
    } catch (err) {
      console.error('Failed to delete election:', err);
      res.status(500).json({ error: 'Failed to delete election' });
    }
  });
      // To the winner id
    app.get("/winner/:id", async(req, res)=> {
    try {
        const getElectionDetails = await electionsCollection.findById(req.params.id)

        electionResult = getElectionDetails.result
        let highestValue = -Infinity
        let winningParty = null
        for(const parties in electionResult){
            const value = electionResult[parties]
            
            if(value > highestValue){
                highestValue = value
                winningParty =parties
                
            }
        }
        res.status(200).json({message: `The winner of the elelction is ${winningParty} with ${highestValue}`})
    } catch (error) {
        res.status(404).json({
            message: error.message
        })
    }
});

app.post("/createdata", async (req,res)=>{
try {
      const newResult = await new electionsCollection(req.body);
   const  electionResult = newResult.result

      let highestValue = -Infinity
      let winningParty = null
      for(const parties in electionResult){
          const value = electionResult[parties]
          
          if(value > highestValue){
              highestValue = value
              winningParty = parties
              
          }
      }
      newResult.save()
      res.status(200).json({message: `The winner of this state is ${winningParty} with ${highestValue}`, data:newResult})
  } catch (error) {
      res.status(404).json({
          message: error.message
      })
  }
 }
)

// TO GET THE WINNER FOR EACH STATE
app.get("/stateWinner/:state", async (req, res) => {
  try {
    const { state } = req.params;
    const electionResult = await electionsCollection.findOne({ state });

    if (!electionResult) {
      res.status(404).json({
        error: "No election result found for the specified state.",
      });
    } else {
      const resultData = electionResult.result;
      let stateWinner = null;
      let highestVoteCount = null;

      for (const party in resultData) {
        if (resultData.hasOwnProperty(party)) {
          const voteCount = resultData[party];
          if (highestVoteCount === null || voteCount > highestVoteCount) {
            highestVoteCount = voteCount;
            stateWinner = party;
          }
        }
      }
        res.status(200).json({
        Message: `The winner in this state is ${stateWinner}`,
        state,
        stateWinner,
      });
    }
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

//To get the overall winner in the Election

app.get("/overallWinner", async (req, res) => {
  try {
    const allResults = await electionsCollection.find();
    if (!allResults || allResults.length === 0) {
      res.status(404).json({
        error: "No election results found.",
      });
    } else {
      let overallResults = {};
      for (const result of allResults) {
        const resultData = result.result;
        for (const party in resultData) {
          if (resultData.hasOwnProperty(party)) {
            const voteCount = resultData[party];
            if (overallResults.hasOwnProperty(party)) {
              overallResults[party] += voteCount;
            } else {
              overallResults[party] = voteCount;
            }
          }
        }
      }

      let overallWinner = null;
      let highestVoteCount = null;
      for (const party in overallResults) {
        if (overallResults.hasOwnProperty(party)) {
          const voteCount = overallResults[party];
          if (highestVoteCount === null || voteCount > highestVoteCount) {
            highestVoteCount = voteCount;
            overallWinner = party;
          }
        }
      }

      res.status(200).json({
        message: `The winner of the  Election is: ${overallWinner}`,
        overallWinner,
        results: overallResults,
      });
    }
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

// Connect to MongoDB

mongoose.connect("mongodb+srv://amagbaugochukwu:tNGFBoZKclidj2J1@cluster0.jyrip2b.mongodb.net/")
.then( () =>{
    console.log("connection to the database is successful");
})

  app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
  });

