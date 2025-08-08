// import {React} from 'react';
// import {View, Text, TouchableOpacity, FlatList} from 'react-native';
// import BouncyCheckbox from "react-native-bouncy-checkbox";

// import PropTypes from 'prop-types';

// const TaskCard = ({ task, onPress }) => (
//   <TouchableOpacity onPress={onPress} style={{ padding: 10, borderBottomWidth: 1 }}>
//     <Text style={{ fontWeight: 'bold' }}>{task.title}</Text>
//     <Text>{task.description}</Text>
//     {task.steps.map((step, index) => (
//       <BouncyCheckbox
//         key={index}
//         size={15}
//         fillColor="black"
//         unFillColor="#FFFFFF"
//         text={step}
//         iconStyle={{ borderColor: "red" }}
//         innerIconStyle={{ borderWidth: 1 }}
//         textStyle={{ fontFamily: "Times New Roman", color:'black' }}
//         onPress={(isChecked: boolean)=>{}}
//       />
//     ))}
//   </TouchableOpacity>
// );

// TaskCard.propTypes = {
//   task: PropTypes.shape({
//     id: PropTypes.string.isRequired,
//     title: PropTypes.string.isRequired,
//     description: PropTypes.string.isRequired,
//     isCompleted: PropTypes.bool.isRequired,
//     category: PropTypes.oneOf(['supplies', 'planning', 'skills', 'home']).isRequired,
//     disasterTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
//     steps: PropTypes.arrayOf(PropTypes.string),
//     imageUrl: PropTypes.string,
//   }).isRequired,
//   onPress: PropTypes.func,
// };

// export default TaskCard;
