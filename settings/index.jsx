
function mySettings(props) {
  return (
    <Page>
      <Section
        title={<Text bold align="center">Train Countdown settings</Text>}>
        <AdditiveList
          title="Stations"
          settingsKey="stations"
          maxItems="10"
          addAction={
            <TextInput
              title="Add List Item"
              label="Item Name"
              placeholder="Type something"
              action="Add Item"
              onAutocomplete={async (value) => {
                var values = await fetch('https://api.irail.be/stations/?format=json', {"User-Agent": "Train Down for FitBit/0.0.1 (https://pietercolpaert.be/)"}).then((res) => {
                  //turn into JSON
                  return res.json();
                }).then ((res) => {
                  //get the deeper object
                  return res.station;
                });
                return values.filter((option) => option.name.startsWith(value));
              }}
            />
          }
        />
      </Section>
    </Page>
  );
}

registerSettingsPage(mySettings);
