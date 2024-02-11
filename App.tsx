import { StyleSheet, View, Text, Linking, StatusBar } from 'react-native'
import * as Contacts from 'expo-contacts'
import { StrictMode, useEffect, useRef, useState } from 'react'
import { FlashList } from '@shopify/flash-list'
import Ionicons from '@expo/vector-icons/FontAwesome5'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import type Icon from '@expo/vector-icons/createIconSet'
import { speak } from './utils/speaking'
import RNImmediatePhoneCall from 'react-native-immediate-phone-call'

const FontAwesome5Icons = Ionicons as ReturnType<typeof Icon>

function filterMultiplePhones(contacts: Contacts.Contact[]) {
  const result = contacts.slice()
  for (let index = 0; index < result.length; index++) {
    const item = result[index]
    if (item.phoneNumbers && item.phoneNumbers.length > 1) {
      for (let pi = 0; pi < item.phoneNumbers.length; pi++) {
        if (pi === 0) {
          continue
        }
        const phoneNumber = item.phoneNumbers[pi]
        result.splice(index + 1, 0, {
          ...item,
          name: item.name + ' ' + (pi + 1),
          phoneNumbers: [phoneNumber]
        })
      }
      item.phoneNumbers = [item.phoneNumbers[0]]
    }
  }
  return result
}

export default function App() {
  const [contacts, setContacts] = useState<Contacts.Contact[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  useEffect(() => {
    ;(async () => {
      const { granted } = await Contacts.getPermissionsAsync()
      if (!granted) {
        const { status } = await Contacts.requestPermissionsAsync()
        if (status !== 'granted') {
          return
        }
      }
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers]
      })
      if (data.length > 0) {
        const formatedContacts = filterMultiplePhones(data)
        setContacts(formatedContacts)
        speak(formatedContacts[0].name)
      }
    })()
  }, [])
  const iconSize = 80

  const flashListRef = useRef<FlashList<Contacts.Contact>>(null)
  function changeIndex(step: 1 | -1) {
    let nextIndex: number
    switch (step) {
      case 1:
        nextIndex = selectedIndex >= contacts.length - 1 ? 0 : selectedIndex + 1
        setSelectedIndex(nextIndex)

        break
      case -1:
        nextIndex = selectedIndex <= 0 ? contacts.length - 1 : selectedIndex - 1
        setSelectedIndex(nextIndex)
        break
    }
    flashListRef.current?.scrollToIndex({ index: nextIndex })
    const contactName = contacts[nextIndex].name
    speak(contactName)
  }

  function makingACall() {
    const phone = contacts[selectedIndex].phoneNumbers?.at(0)
    if (!phone) {
      speak('这个联系人没有设置号码')
    } else {
      RNImmediatePhoneCall.immediatePhoneCall(phone.number)
    }
  }

  return (
    <StrictMode>
      <View style={styles.container}>
        <StatusBar />
        <Text style={{ height: 50, textAlignVertical: 'center', fontSize: 30, fontWeight: 'bold' }}>电话本</Text>
        <View style={{ height: '70%', width: '100%' }}>
          <FlashList
            ref={flashListRef}
            data={contacts}
            renderItem={({ item, index }) => (
              <Text style={[{ fontSize: 25, paddingVertical: 8, paddingHorizontal: 20 }, index === selectedIndex && { backgroundColor: '#3498db', color: 'white' }]}>{item.name}</Text>
            )}
            estimatedItemSize={42.9}
            ItemSeparatorComponent={() => <View style={{ height: 0.5, backgroundColor: '#bdc3c7' }} />}
            extraData={selectedIndex}
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1, width: '100%', paddingHorizontal: 80 }}>
          <MaterialIcons name="call" size={iconSize} color="green" onPress={makingACall} />
          <View style={{ justifyContent: 'space-around', height: '100%' }}>
            <FontAwesome5Icons name="chevron-circle-up" size={iconSize} onPress={() => changeIndex(-1)} />
            <FontAwesome5Icons name="chevron-circle-down" size={iconSize} onPress={() => changeIndex(1)} />
          </View>
        </View>
      </View>
    </StrictMode>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center'
  }
})
