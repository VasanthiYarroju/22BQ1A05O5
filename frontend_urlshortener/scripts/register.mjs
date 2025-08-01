import fetch from "node-fetch";


const register = async () => {
  const response = await fetch("http://128.199.16.144/evaluation-service/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "vasanthiyarroju@gmail.com",
      name: "Vasanthi Yarroju",
      college: "Vasireddy Vnekatadri Institute of Technology",
      githubUsername: "VasanthiYarroju",
      rollno: "22BQ1A05O5",
      secret: "PnVBFV" 
    }),
  });

  const data = await response.json();
  console.log(data);
};

register();
