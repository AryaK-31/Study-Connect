import bcrypt from 'bcryptjs';
import fs from 'fs';

const generateData = async () => {
  const password = await bcrypt.hash('password123', 10);
  
  const users = [
    {
      name: "Alice Johnson",
      email: "alice@uts.edu.au",
      password: password,
      interests: ["Machine Learning", "Python", "Data Science"],
      availability: ["Monday Afternoon", "Wednesday Morning"],
      contactNumber: "0412345678",
      profileUpdated: true
    },
    {
      name: "Bob Smith",
      email: "bob@uts.edu.au",
      password: password,
      interests: ["Web Development", "React", "JavaScript"],
      availability: ["Tuesday Evening", "Thursday Afternoon"],
      contactNumber: "0423456789",
      profileUpdated: true
    },
    {
      name: "Charlie Brown",
      email: "charlie@uts.edu.au",
      password: password,
      interests: ["Cyber Security", "Networking", "Linux"],
      availability: ["Friday Morning", "Saturday Afternoon"],
      contactNumber: "0434567890",
      profileUpdated: true
    },
    {
      name: "Diana Prince",
      email: "diana@uts.edu.au",
      password: password,
      interests: ["UI/UX Design", "Figma", "Frontend"],
      availability: ["Monday Morning", "Thursday Evening"],
      contactNumber: "0445678901",
      profileUpdated: true
    },
    {
      name: "Ethan Hunt",
      email: "ethan@uts.edu.au",
      password: password,
      interests: ["Mobile Apps", "Flutter", "Dart"],
      availability: ["Wednesday Evening", "Sunday Afternoon"],
      contactNumber: "0456789012",
      profileUpdated: true
    }
  ];

  fs.writeFileSync('users_mock.json', JSON.stringify(users, null, 2));
  console.log('Mock data generated in users_mock.json');
};

generateData();
