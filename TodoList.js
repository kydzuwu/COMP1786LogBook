import { useState, useEffect } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Alert,
} from "react-native";
import Constants from "expo-constants";
import * as SQLite from "expo-sqlite";

function openDatabase() {
  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSql: () => { },
        };
      },
    };
  }

  const db = SQLite.openDatabaseSync("db.db");
  db.withTransactionSync(() => {
    db.runSync(
      `create table if not exists items (id integer primary key not null, done int, value text);`
    );
  });
  return db;
}

const db = openDatabase();

function Items({ done: doneHeading, onPressItem, onDeleteItem, onEditItem }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    db.withTransactionSync(() => {
      setItems(
        db.getAllSync(
          `select * from items where done = ?;`,
          doneHeading ? 1 : 0
        )
      );
    });
  }, []);

  const heading = doneHeading ? "Completed" : "Todo";

  if (items === null || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeading}>{heading}</Text>
      {items.map(({ id, done, value }) => {
        return (
          <View key={id} style={styles.todoItem}>
            <TouchableOpacity
              onPress={() => onPressItem && onPressItem(id)}
              style={styles.itemTextContainer}
            >
              <Text style={[styles.itemText, done && styles.completedText]}>
                {value}
              </Text>
            </TouchableOpacity>
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                onPress={() => onEditItem(id, value)}
                style={styles.editButton}
              >
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onDeleteItem && onDeleteItem(id)}
                style={styles.deleteButton}
              >
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onPressItem && onPressItem(id)}
                style={styles.completeButton}
              >
                <Text style={styles.buttonText}>{done ? "Undo" : "Complete"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function App() {
  const [text, setText] = useState(null);
  const [forceUpdate, forceUpdateId] = useForceUpdate();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const add = (text) => {
    if (text === null || text === "") {
      return false;
    }

    db.withTransactionSync(() => {
      db.runSync(`insert into items (done, value) values (0, ?)`, text);
      forceUpdate();
    });
  };

  const deleteItem = (id) => {
    db.withTransactionSync(() => {
      db.runSync(`delete from items where id = ?;`, id);
      forceUpdate();
    });
  };

  const editItem = (id, newValue) => {
    db.withTransactionSync(() => {
      db.runSync(`update items set value = ? where id = ?;`, [newValue, id]);
      forceUpdate();
    });
  };

  const handleEdit = (id, currentValue) => {
    setEditingId(id);
    setEditingText(currentValue);
    setModalVisible(true); // Show modal
  };

  const handleSaveEdit = () => {
    if (editingText.trim() === "") {
      Alert.alert("Error", "Task cannot be empty.");
      return;
    }
    editItem(editingId, editingText);
    setModalVisible(false);
    setEditingText("");
    setEditingId(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>To Do App</Text>

      {Platform.OS === "web" ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={styles.heading}>
            Expo SQLite is not supported on web!
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.flexRow}>
            <TextInput
              onChangeText={(text) => setText(text)}
              onSubmitEditing={() => {
                add(text);
                setText(null);
              }}
              placeholder="What do you need to do?"
              style={styles.input}
              value={text}
            />
          </View>
          <ScrollView style={styles.listArea}>
            <Items
              key={`forceupdate-todo-${forceUpdateId}`}
              done={false}
              onPressItem={(id) =>
                db.withTransactionSync(() => {
                  db.runSync(`update items set done = 1 where id = ?;`, id);
                  forceUpdate();
                })
              }
              onDeleteItem={deleteItem} // Pass delete function
              onEditItem={handleEdit} // Pass edit function
            />
            <Items
              done
              key={`forceupdate-done-${forceUpdateId}`}
              onPressItem={(id) =>
                db.withTransactionSync(() => {
                  db.runSync(`update items set done = 0 where id = ?;`, id);
                  forceUpdate();
                })
              }
              onDeleteItem={deleteItem}
              onEditItem={handleEdit}
            />
          </ScrollView>
          {/* Modal for Editing */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => {
              setModalVisible(false);
            }}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Edit Task</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editingText}
                  onChangeText={setEditingText}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    onPress={handleSaveEdit}
                    style={styles.saveButton}
                  >
                    <Text style={styles.buttonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

function useForceUpdate() {
  const [value, setValue] = useState(0);
  return [() => setValue(value + 1), value];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    paddingTop: Constants.statusBarHeight,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
    color: "#333",
  },
  flexRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    height: 48,
    borderColor: "#6a5acd",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listArea: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    marginHorizontal: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  todoItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
  },
  completedText: {
    textDecorationLine: "line-through",
    color: "#888",
  },
  buttonsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#1e90ff", // Blue background for edit button
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
  },
  deleteButton: {
    backgroundColor: "#dc143c", // Red background for delete button
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
  },
  completeButton: {
    backgroundColor: "#1c9963", // Green background for complete button
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
  },
  buttonText: {
    color: "#ffffff", // White text for buttons
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Dimmed background
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalInput: {
    height: 40,
    borderColor: "#6a5acd",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    width: "100%",
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  saveButton: {
    backgroundColor: "#1c9963",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 8,
  },
  cancelButton: {
    backgroundColor: "#dc143c",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flex: 1,
  },
});

