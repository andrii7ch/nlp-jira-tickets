const replaceStressedVowels = word => {
  const stressedLetters = {'а́': 'а', 'е́': 'е', 'є́': 'є', 'и́': 'и', 'і́': 'і', 'ї́': 'ї', 'о́': 'о', 'у́': 'у', 'ю́': 'ю', 'я́': 'я'};
  
  for(let letter in stressedLetters)
    word = word.replace(new RegExp(letter, 'g'), stressedLetters[letter]);

  return word
};

const exclusions = {
  'відер': 'відр',
  'був': 'бува'
};

let stable_exclusions = [
  'баядер', 'беатріче',
  'віче',
  'наче', 'неначе',
  'одначе',
  'паче'
];

stable_exclusions = stable_exclusions.sort((a, b) => b.length - a.length);

const stable_endings = [
  'ер',
  'ск'
];

const change_endings = {
  'аче': 'ак',
  'іче': 'ік',
  'йовував': 'йов', 'йовувала': 'йов', 'йовувати': 'йов',
  'цьовував': 'ц', 'цьовувала': 'ц', 'цьовувати': 'ц',
  'ьовував': 'ьов', 'ьовувала': 'ьов', 'ьовувати': 'ьов',
  'ядер': 'ядр'
};

let word_ends = [
  'а', 'ам', 'ами', 'ах', 'та',
  'в', 'вав', 'вавсь', 'вався', 'вала', 'валась', 'валася', 'вали', 'вались', 'валися', 'вало', 'валось', 'валося', 'вати', 'ватись', 'ватися', 'всь', 'вся',
  'е', 'еві', 'ем', 'ею',
  'є', 'ємо', 'ємось', 'ємося', 'ється', 'єте', 'єтесь', 'єтеся', 'єш', 'єшся', 'єю',
  'и', 'ив', 'ий', 'ила', 'или', 'ило', 'илося', 'им', 'ими', 'имо', 'имось', 'имося', 'ите', 'итесь', 'итеся', 'ити', 'ить', 'иться', 'их', 'иш', 'ишся',
  'й', 'ймо', 'ймось', 'ймося', 'йсь', 'йся', 'йте', 'йтесь', 'йтеся',
  'і', 'ів', 'ій', 'ім', 'імо', 'ість', 'істю', 'іть',
  'ї',
  'ла', 'лась', 'лася', 'ло', 'лось', 'лося', 'ли', 'лись', 'лися',
  'о', 'ові', 'овував', 'овувала', 'овувати', 'ого', 'ої', 'ок', 'ом', 'ому', 'осте', 'ості', 'очка', 'очкам', 'очками', 'очках', 'очки', 'очків', 'очкові', 'очком', 'очку', 'очок', 'ою',
  'ти', 'тись', 'тися',
  'у', 'ував', 'увала', 'увати',
  'ь',
  'ці',
  'ю', 'юст', 'юсь', 'юся', 'ють', 'ються',
  'я', 'ям', 'ями', 'ях'
];

word_ends = word_ends.sort((a, b) => b.length - a.length);

module.exports = word => {
  word = replaceStressedVowels(word);

  if(word.length <= 2) return word;
  
  if(exclusions[word]) return exclusions[word];

  if(stable_exclusions.includes(word)) return word;
  
  for(let ending of stable_endings)
    if(word.endsWith(ending))
      return word;

  for(let ending in change_endings)
    if(word.endsWith(ending))
      return word.substring(0, word.length - ending.length) + change_endings[ending];

  for(let ending of word_ends)
    if(word.endsWith(ending)) {
      const trimmed = word.substring(0, word.length - ending.length);
      if(trimmed.length > 2) return trimmed;
    }
  
  return word
};