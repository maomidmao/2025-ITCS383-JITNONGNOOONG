# JITNONGNOONG_D1_Design

## C4 Diagram
### 1. Context Diagram

**Explanation:** The design of this Context Diagram shows the big picture of the Dog Adoption System. It shows which and conceptually how actors and external systems interact with the system.

![Context Diagram](https://github.com/ICT-Mahidol/2025-ITCS383-JITNONGNOOONG/blob/master/designs/diagrams/ContextDiagram.png)

1. Requirements Alignment: The diagram addresses key stakeholders from the requirements and show who need and do what:
    - General Thai Users: Browse and View Dog list, Add the Dog to favorite list, and Make an Adoption
    - Organization Staff: Manage Dog and Adoption
    - Admin: Manage Report
    - Eligible Sponser: Make Donation and Upload their Banner
2. Design Decision: 
    - External Integration: External systems like the Criminal Record System, Blacklist System, and Citizen Profile System are included to support the requirement for verifying adopter eligibility from outsource databases.
    - System Boundary: It separates where our system is responsible for and what are the external dependencies.

### 2. Container diagrams

**Explanation:** The design of this Container Diagram shows the architecture of the Dog Adoption System, which is a web based system. It shows that the actors interact with the Web UI only for convenience. Then, the Web UI will send a request or call an API to the Backend container, which is the core logic of the system. After that, the Backend container will fetch the data from the databases or retrieve data from the External systems based on the API.

![Container Diagram](https://github.com/ICT-Mahidol/2025-ITCS383-JITNONGNOOONG/blob/master/designs/diagrams/ContainerDiagram.png)

1. Requirements Alignment: The diagram supports the requirement of web apllications systems and allows user to interact with easy-to-use UI.
2. Design Decision: 
    - Architecture Pattern: The use of a Web UI (HTML5) and a Backend (JavaScript/Node.js) suggests a client-server architecture. 
    - Responsibility: The Backend container is designed to communicate with external APIs (e.g., Criminal Records) and managing data flow to the various database, while Web UI container receives the request from users and call the Backend.

### 3. Component diagrams

**Explanation:** The Component Diagram is separated by the containers. The first one is Backend container, where the logics behind the system are called via API from the Web UI. The second one is the Web UI container which contains the web frontend components where the users interact with.

#### 3.1. Backend Component Diagram

![Backend Component Diagram](https://github.com/ICT-Mahidol/2025-ITCS383-JITNONGNOOONG/blob/master/designs/diagrams/BackendComponentDiagram.png)

1. Requirements Alignment: Each component from the functional requirements is divided into API to clearly handle only related tasks.
    - Verify Component: handle interaction with external systems before allowing an adoption process.
    - Adoption API: handle the adoption request and call Verify Component to process the request.
    - Report API: handle gathering data and generating the report
    - LogIn API: handle user's login, authentication and call Security Component to securely fetch data from the databases.
    - SignIn API: handle user's signin, registration and call Security Component to securely fetch data from the databases.
    - Dog Profile API: handle dog profiles management (CRUD) and dog database connection.
2. Design Decisions:
    - API-Driven Design: The backend is organized into functional APIs to ensure modularity and ease of maintenance.
    - System Boundary: The boundary clearly separates that the Backend component will be in JavaScript and will responsible only for logic of the system, database connection, and external systems communication.

#### 3.2. Web UI Component Diagram

![WebUI Component Diagram](https://github.com/ICT-Mahidol/2025-ITCS383-JITNONGNOOONG/blob/master/designs/diagrams/WebUIComponentDiagram.png)

1. Requirements Alignment: Each component from the functional requirements that users directly interact with is divided into web page component. Each page contains elements that users can easily use and aligns with the backend components. 
2. Design Decisions:
    - Role-Based UI: Different components are tailored to specific users, such as the Dog Profile Management for Organization Staff and Report Dashboard for Admin Staff.
    - System Boundary: The boundary is clearly separates that the Web UI component will be in HTML and will responsible only for user interaction and API calling.

## Additional Diagram
### Data Flow Diagram

#### Level 0
```mermaid
flowchart LR
  %% External Entities
  U["General User(Thai only)"]
  S[Organization Staff]
  A[Admin]
  SP[Sponsor]

  %% System (single process)
  P0(("P0: Adoption System"))

  %% ACTOR
  %%USER
  U -->|"Password"| P0
  U -->|"Email"| P0
  U -->|"Adoption Request"| P0
  U -->|"Delivery Date"| P0
  U -->|"Image"| P0
  U -->|"Info"| P0
  P0 -->|"Status"| U

%%STAFF
  S -->|"Password"| P0
  S -->|"Email"| P0
  S -->|"Image"| P0
  S -->|"General Info"| P0
  S -->|"Traning Profile"| P0
  S -->|"Medical Profile"| P0
  S -->|"Personality"| P0
  S -->|"Dog Status"| P0
  S -->|"Visit record"| P0
  P0 -->|"Visit record"| S
  P0 --> |"Adoption Request"| S
  P0 -->|"Dog Status"| S

%%SPONSOR
  SP -->|"Password"| P0
  SP -->|"Email"| P0
  SP -->|"Banner"| P0
  SP -->|"Donation"| P0
  P0 -->|"Status"| SP

%%ADMIN
  A -->|"Password"| P0
  A -->|"Email"| P0
  A -->|"Report Request"| P0
  P0 -->|"Report"| A
```

#### Level 1
```mermaid
flowchart LR
  %% External Entities
  U["General User(Thai only)"]
  S["Organization Staff"]
  A["Admin"]
  SP["Sponsor"]

  %% Processes
  P1(("1. Authentication & Verification"))
  P2(("2. Dog Management"))
  P3(("3. Adoption Management"))
  P4(("4. Sponsor Management"))
  P5(("5. Check-up Management"))
  P6(("6. Reporting"))

  %% Data Stores
  D1[("D1 User Database")]
  D2[("D2 Dog Database")]
  D3[("D3 Sponser Database")]
  D4[("D4 Adoption Database")]

  %% --- Authentication & Verification ---
  U -->|"Password"| P1
  U -->|"Email"| P1
  SP -->|"Password"| P1
  SP -->|"Email"| P1
  S -->|"Password"| P1
  S -->|"Email"| P1
  A -->|"Password"| P1
  A -->|"Email"| P1
  D1 -->|"Password"| P1
  D1 -->|"Email"| P1
  D3 -->|"Password"| P1
  D3 -->|"Email"| P1
  P1 -->|"Password"| D1
  P1 -->|"Email"| D1
  P1 -->|"Password"| D3
  P1 -->|"Email"| D3
  P1 -->|"Status"| U
  P1 -->|"Status"| S
  P1 -->|"Status"| A
  P1 -->|"Status"| SP

  %% --- Dog Management ---
  S -->|"Image"| P2
  S -->|"General Info"| P2
  S -->|"Traning Profile"| P2
  S -->|"Medical Profile"| P2
  S -->|"Personality"| P2
  S -->|"Dog Status"| P2
  P2 -->|"Dog Status"| S
  P2 -->|"Image"| D2
  P2 -->|"General Info"| D2
  P2 -->|"Traning Profile"| D2
  P2 -->|"Medical Profile"| D2
  P2 -->|"Personality"| D2
  P2 -->|"Dog Status"| D2
  D2 -->|"Image"| P2
  D2 -->|"General Info"| P2
  D2 -->|"Traning Profile"| P2
  D2 -->|"Medical Profile"| P2
  D2 -->|"Personality"| P2
  D2 -->|"Dog Status"| P2

  %% --- Adoption Management ---
  U -->|"Adoption Request"| P3
  D2 -->|"Dog Profile"| P3
  D1 -->|"User Profile"| P3
  P3 --> |"Adoption Request"| S
  P3 -->|"Dog Profile"| S
  P3 -->|"User Profile"| S
  S -->|"Approval Status"| P3
  P3 -->|"Approval Status"| U
  P3 -->|"Adoption Request"| D4
  D4 -->|"Adoption Request"| P3
  U -->|"Delivery Date"| P3
  P3 -->|"Delivery Date"| D4

  %% --- Sponsor Management ---
  SP -->|"Banner"| P4
  SP -->|"Donation"| P4
  P4 -->|"Banner"| D3
  P4 -->|"Donation"| D3
  D3 -->|"Banner"| P4

  %% --- Check-up Management ---
  D4 -->|"Adoption Info"|P5
  U -->|"Adopted Image"| P5
  U -->|"Info"| P5
  S -->|"Visit record"| P5
  P5 -->|"Visit record"| S

  %% --- Reporting ---
  A -->|"Report Request"| P6
  D2 -->|"Dog Info"| P6
  D4 -->|"Adoption Info"| P6
  P5 -->|"Visit record"| P6
  P6 -->|"Report"| A
```

#### Level 2
**1. Authentication and Verification**
```mermaid
flowchart LR
  U["General User (Thai only)"]:::ext
  S["Organization Staff"]:::ext
  A["Admin"]:::ext
  SP["Sponsor"]:::ext

  P11(("1.1 Register")):::proc
  P12(("1.2 Login")):::proc
  P13(("1.3 Verification")):::proc
  P14(("1.4 Authorization")):::proc

  D1[("D1 User Database")]:::store
  D3[("D3 Sponsor Database")]:::store

  U -->|"Email"| P11
  U -->|"Password"| P11
  S -->|"Email"| P11
  S -->|"Password"| P11
  A -->|"Email"| P11
  A -->|"Password"| P11
  SP -->|"Email"| P11
  SP -->|"Password"| P11

  U -->|"Email"| P12
  U -->|"Password"| P12
  S -->|"Email"| P12
  S -->|"Password"| P12
  A -->|"Email"| P12
  A -->|"Password"| P12
  SP -->|"Email"| P12
  SP -->|"Password"| P12

  D1 -->|"Email"| P12
  D1 -->|"Password"| P12
  D3 -->|"Email"| P12
  D3 -->|"Password"| P12

  P11 -->|"Email"| D1
  P11 -->|"Password"| D1
  P11 -->|"Email"| D3
  P11 -->|"Password"| D3

  P11 -->|"Status"| P13
  P12 -->|"Status"| P13
  P13 -->|"Status"| P14

  P14 -->|"Status"| U
  P14 -->|"Status"| S
  P14 -->|"Status"| A
  P14 -->|"Status"| SP
```

**2. Dog Management**
```mermaid
flowchart LR
  S["Organization Staff"]:::ext

  P21(("2.1 View Dog List")):::proc
  P22(("2.2 View Dog Profile")):::proc
  P23(("2.3 Add Dog Profile")):::proc
  P24(("2.4 Update Dog Profile")):::proc
  P25(("2.5 Delete Dog Profile")):::proc

  D2[("D2 Dog Database")]:::store

  S --> P21
  S --> P22

  D2 -->|"Image"| P21
  D2 -->|"General Info"| P21
  D2 -->|"Training Profile"| P21
  D2 -->|"Medical Profile"| P21
  D2 -->|"Personality"| P21
  D2 -->|"Dog Status"| P21

  D2 -->|"Image"| P22
  D2 -->|"General Info"| P22
  D2 -->|"Training Profile"| P22
  D2 -->|"Medical Profile"| P22
  D2 -->|"Personality"| P22
  D2 -->|"Dog Status"| P22

  P21 --> P22

  S -->|"Image"| P23
  S -->|"General Info"| P23
  S -->|"Training Profile"| P23
  S -->|"Medical Profile"| P23
  S -->|"Personality"| P23
  S -->|"Dog Status"| P23

  S -->|"Image"| P24
  S -->|"General Info"| P24
  S -->|"Training Profile"| P24
  S -->|"Medical Profile"| P24
  S -->|"Personality"| P24
  S -->|"Dog Status"| P24

  S -->|"Dog Status"| P25

  P23 -->|"Image"| D2
  P23 -->|"General Info"| D2
  P23 -->|"Training Profile"| D2
  P23 -->|"Medical Profile"| D2
  P23 -->|"Personality"| D2
  P23 -->|"Dog Status"| D2

  P24 -->|"Image"| D2
  P24 -->|"General Info"| D2
  P24 -->|"Training Profile"| D2
  P24 -->|"Medical Profile"| D2
  P24 -->|"Personality"| D2
  P24 -->|"Dog Status"| D2

  P25 -->|"Dog Status"| D2

  P23 -->|"Dog Status"| S
  P24 -->|"Dog Status"| S
  P25 -->|"Dog Status"| S
```

**3. Adoption Management**
```mermaid
flowchart LR
  U["General User(Thai only)"]
  S["Organization Staff"]

  P31(("3.1 Add to Favorite"))
  P32(("3.2 Make Adoption Request"))
  P33(("3.3 View Request"))
  P34(("3.4 Approve/Reject Adoption Request"))
  P35(("3.5 Result Notification"))
  P36(("3.6 Delivery Scheduling"))

  D1[("D1 User Database")]
  D2[("D2 Dog Database")]
  D4[("D4 Adoption Database")]

  D1 -->|"User Profile"| P31
  D2 -->|"Dog Profile"| P31
  U --> P31

  U -->|"Adoption Request"| P32
  D2 -->|"Dog Profile"| P32
  D1 -->|"User Profile"| P32

  P32 -->|"Adoption Request"| D4

  D4 -->|"Adoption Request"| P33
  P33 -->|"Adoption Request"| S

  S -->|"Approval Status"| P34

  P33 --> P34
  P34 --> P35

  P35 -->|"Approval Status"| U

  U -->|"Delivery Date"| P36
  P36 -->|"Delivery Date"| D4
```

**4. Sponser Management**
```mermaid
flowchart LR
  SP["Sponsor"]
  U["General User(Thai only)"]

  P41(("4.1 Upload Banner"))
  P42(("4.2 Make Donation"))
  P43(("4.3 Display Banner"))

  D3[("D3 Sponser Database")]

  SP -->|"Banner"| P41
  P41 -->|"Banner"| D3

  SP -->|"Donation"| P42
  P42 -->|"Donation"| D3

  D3 -->|"Banner"| P43
  P43 -->|"Banner"| U
```

**5. Check-up Management**
```mermaid
flowchart LR
  U["General User(Thai only)"]
  S["Organization Staff"]

  P51(("5.1 Notification"))
  P52(("5.2 Upload Picture and Info"))
  P53(("5.3 View Check-up"))
  P54(("5.4 Make Visit Request"))
  P55(("5.5 Record Visit"))

  D4[("D4 Adoption Database")]

  D4 -->|"Adoption Info"| P51

  P51 --> P52
  P51 --> P54

  U -->|"Adopted Image"| P52
  U -->|"Info"| P52

  P52 -->|"Adopted Image"| P53
  P52 -->|"Info"| P53
  U --> P53
  S --> P53

  S -->|"Visit record"| P55
  P55 -->|"Visit record"| S

  P54 --> P55
```

**6. Reporting**
```mermaid
flowchart LR
  A["Admin"]

  P61(("6.1 Request Report"))
  P62(("6.2 Compile and Process Dog/Adoption/Check-up history data"))
  P63(("6.3 Generate Report"))

  D2[("D2 Dog Database")]
  D4[("D4 Adoption Database")]

  A -->|"Report Request"| P61

  D2 -->|"Dog Info"| P62
  D4 -->|"Adoption Info"| P62

  P5(("5. Check-up Management")) -->|"Visit record"| P62

  P61 --> P62
  P62 --> P63

  P63 -->|"Report"| A
```

### Class Diagram
#### Explanation: 
The class diagram is designed to handle the specific logic of a non-profit adoption workflow while maintaining system security. 
    - Accessibility & User Roles: The User abstract class ensures a unified login for all ages, while specific subclasses like General_User, Organization_Staff, and Admin provide the tailored interfaces required for their specific tasks .
    - Dog Profile & High-Res Content: The Dog class includes attributes for dogimage and medicalProfile. It links to TreatmentRecord and TrainingRecord to ensure dogs are only added to the "Available" list after completing their practicing/medical phases.
    - Verification Interface: The VerificationService and CitizenProfileService interfaces are designed to call the police criminal record and blacklist systems before an adoption is approved, satisfying the "enhancing security" requirement .
    - Post-Adoption Tracking: The relationship between AdoptionForm and Dog allows the system to log the "one-year check-up" data, satisfying the requirement to record monthly photos and updates.
    - Sponsor Management: The Eligible_sponsors class handles the unique requirement of a fixed banner size regardless of the donation amount.
    
```mermaid
classDiagram
direction TB
   class User {
       <<Abstract>>
       - firstName : String
       - lastName : String
       - email : String
       - PasswordHashing : String
       - Role : String
       + getRole() String
       + getFullName() String
       + getEmail() String
       + login()
   }


   class Admin {
       - AdminId : int
       + generateReport()
   }


   class Organization_Staff {
       - staffId: int
       + manageDogProfile()
       + approveRequest()
       + viewAdopterList()
       + verifyAdopter(citizenId : String)
       + checkform(AdoptionForm : adoptionform)
       + recordTreatment()
   }


   class General_User {
       - citizenId : Int
       - userId : Int
       - PhoneNum : string
       + viewDogList()
       + viewdogProfile(dogId)
       + addToFavorite(dogId)
       + submitAdoptionRequest(dogId)
       + BookSchedule(dogId: int, selectedDate: DateTime)
   }


   class Eligible_sponsors {
       - UserName : String
       - sponsorId : int
       + register()
       + donateMoney()
       + inputBanner()
   }


   class DeliverySchedule {
       - appointmentDate : DateTime
       - location : String
       + confirmSchedule()
   }


   class FavoriteList {
       - savedDogs : List
       + addDog(Id)
       + removeDog(Id)
   }


   class TreatmentRecord {
       - treatmentId : int
       - dogId : int
       - treatmentDetail : String
       - treatmentDate : Date
       + addTreatment()
       + updateTreatment()
   }


   class TrainingRecord {
       - trainingId : int
       - dogId : int
       - trainingDetail : String
       - trainingDate : Date
       - LeashTrained : Boolean
       - CrateTrained : Boolean
       - FoodTrained : Boolean
       - HouseTrained : Boolean
       + addTraining()
       + updateTraining()
   }


   class AdoptionForm {
       - requestId : int
       - requestDate : Date
       - name : String
       - email : String
       - Phone : String
       - Address : String
       - livingType : String
       - Message : String
       + submitForm()
       + getForm()
   }


   class CitizenProfileService {
       <<Interface>>
       +getThaiCitizenData(citizenId : String)
   }


   class VerificationService {
       <<Interface>>
       +getCriminalRecord(citizenId : String)
       +getBlacklistRecord(citizenId : String)
   }


   class Dog {
       - dogId : int
       - name : String
       - breed : String
       - color : String
       - age : int
       - description : String
       - dogimage : String
       - personality : String
       - medicalProfile : String
       - trainingProfile : String
       - status : DogStatus
       + addDog()
       + updateDogProfile()
       + updateDogStatus()
   }


   class DogStatus {
       <<enumeration>>
       AVAILABLE
       PENDING
       ADOPTED
   }






   User <|-- Admin
   User <|-- Organization_Staff
   User <|-- General_User
   User <|-- Eligible_sponsors


   General_User "1" -- "*" AdoptionForm : "fills/submits"
   General_User "1" -- "1" FavoriteList : "has"
   General_User "1" -- "*" DeliverySchedule : "books"
   AdoptionForm "1" -- "0..1" DeliverySchedule : "triggers"


   Dog "1" -- "*" TreatmentRecord : "has"
   Dog "1" -- "*" TrainingRecord : "has"
   Dog "1" -- "*" AdoptionForm : "is requested by"


   FavoriteList "1" -- "*" Dog : "contains"
   DeliverySchedule "*" -- "1" Dog : "for"


   Organization_Staff "1" -- "*" Dog : "manages"
   Organization_Staff -- AdoptionForm : "reviews (checkform)"


   Admin "1" -- "*" Dog : "monitors"
   Dog -- DogStatus : "uses"
   General_User -- CitizenProfileService : "verifies via"
   Organization_Staff -- VerificationService : "verifies via"
```

