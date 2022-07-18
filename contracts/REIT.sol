// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract RealEstateInvestmentTrust {
    // Public Variables
    uint8 public tax;
    uint256 public totalSupply;
    uint256 public totalSupply2;
    uint256 public rent;
    uint256 public totalBalance;

    string public propertyName;
    string public propertySymbol;

    address public authority; // Could be an issuer, government etc.
    address public mainPropertyOwner; // Will be declared by the authority. Can change tenants.
    address public tenant;

    address[] public shareholders;

    // Mappings
    mapping(address => uint256) public revenues;
    mapping(address => uint256) public shares;
    mapping(address => uint256) public offeredShares;
    mapping(address => uint256) public offeredPricePerShare;

    // Events
    event ShareTransfer(
        address indexed from,
        address indexed to,
        uint256 shares
    );
    event Seizure(
        address indexed seizedfrom,
        address indexed to,
        uint256 shares
    );
    event ChangedTax(uint256 newTax);
    event ShareholderAdded(address newShareholder);
    event ShareholderBanned(address bannedShareholder);
    event ChangedTenant(address tenant);
    event RentPer30DaySetTo(uint256 newRent);
    event RevenuesDistributed(
        address shareholder,
        uint256 gained,
        uint256 total
    );
    event Withdrawal(address shareholder, uint256 withdrawn);
    event SharesOffered(
        address seller,
        uint256 sharesAmount,
        uint256 pricePerShare
    );
    event SharesSold(
        address Seller,
        address Buyer,
        uint256 SharesSold,
        uint256 pricePerShare
    );

    // Constructor
    constructor(
        string memory _propertyName,
        string memory _propertySymbol,
        uint8 _tax
    ) {
        authority = msg.sender;
        propertyName = _propertyName;
        propertySymbol = _propertySymbol;

        tax = _tax;
        totalSupply = 100;
        totalSupply2 = totalSupply**2;

        shareholders.push(authority);
    }

    // Modifiers
    modifier onlyAuthority() {
        require(
            msg.sender == authority,
            "Only the authority is allowed to do it!"
        );
        _;
    }

    modifier onlyPropertyOwner() {
        require(
            msg.sender == mainPropertyOwner,
            "You are not the main property owner!"
        );
        _;
    }

    modifier isTenant() {
        require(msg.sender == tenant, "You are not the tenant!");
        _;
    }

    modifier isMultipleOf() {
        require(msg.value % totalSupply2 == 0);
        _;
    }

    // Function of the Authority
    function setMainPropertyOwner(address _mainPropertyOwner)
        public
        onlyAuthority
    {
        mainPropertyOwner = _mainPropertyOwner;
        shareholders.push(mainPropertyOwner);
        shares[mainPropertyOwner] = 100;
    }

    function addShareholder(address _shareholder) public onlyAuthority {
        (bool _isShareholder, ) = isShareholder(_shareholder);
        if (!_isShareholder) {
            shareholders.push(_shareholder);
            emit ShareholderAdded(_shareholder);
        }
    }

    function banShareholder(address _shareholder) public onlyAuthority {
        (bool _isShareholder, uint256 i) = isShareholder(_shareholder);
        require(_isShareholder);
        shareholders[i] = shareholders[shareholders.length - 1];
        shareholders.pop();
        seizureFrom(_shareholder, authority, shares[_shareholder]);
        emit ShareholderBanned(_shareholder);
    }

    function seizureFrom(
        address _from,
        address _to,
        uint256 _value
    ) public onlyAuthority returns (bool success) {
        (bool _isShareholder, ) = isShareholder(_from);
        if (_isShareholder) {
            shares[_from] -= _value;
            shares[_to] += _value;
            emit Seizure(_from, _to, _value);
            return true;
        } else {
            return false;
        }
    }

    function setTax(uint8 _newTax) public onlyAuthority {
        require(_newTax < 100, "Enter a valid value from 0 to 99");
        tax = _newTax;
        emit ChangedTax(_newTax);
    }

    function distribute() public onlyAuthority {
        uint256 _totalBalance = totalBalance;
        for (uint256 i = 0; i < shareholders.length; i++) {
            address shareholder = shareholders[i];
            uint256 _shares = showSharesOf(shareholder);
            uint256 amountWillBeReceived = (_totalBalance / totalSupply) *
                _shares;
            totalBalance -= amountWillBeReceived;
            revenues[shareholder] += amountWillBeReceived;
            emit RevenuesDistributed(
                shareholder,
                amountWillBeReceived,
                revenues[shareholder]
            );
        }
    }

    // Functions of the Main Prop. Owner
    function setTenant(address _tenant) public onlyPropertyOwner {
        tenant = _tenant;
        emit ChangedTenant(_tenant);
    }

    function setRent(uint256 _rent) public onlyPropertyOwner {
        rent = _rent;
        emit RentPer30DaySetTo(_rent);
    }

    // Shareholders Functions
    function offerShare(uint256 _sharesOffered, uint256 _sharesPrice) public {
        (bool _isShareholder, ) = isShareholder(msg.sender);
        require(_isShareholder);
        require(_sharesOffered <= shares[msg.sender]);
        offeredShares[msg.sender] = _sharesOffered;
        offeredPricePerShare[msg.sender] = _sharesPrice;
        emit SharesOffered(msg.sender, _sharesOffered, _sharesPrice);
    }

    function buyShares(uint256 _sharesToBuy, address payable _from)
        public
        payable
    {
        (bool _isShareholder, ) = isShareholder(msg.sender);
        require(_isShareholder);
        require(
            msg.value == _sharesToBuy * offeredPricePerShare[_from] &&
                _sharesToBuy == offeredShares[_from] &&
                _from != msg.sender
        );
        seizureFrom(_from, msg.sender, _sharesToBuy);
        offeredShares[_from] -= _sharesToBuy;
        _from.transfer(msg.value);
        offeredPricePerShare[_from] = 0;
        emit SharesSold(
            _from,
            msg.sender,
            _sharesToBuy,
            offeredPricePerShare[_from]
        );
    }

    function transferShares(address _recipient, uint256 _amount)
        public
        returns (bool)
    {
        (bool _isShareholder, ) = isShareholder(msg.sender);
        require(_isShareholder);
        require(shares[msg.sender] >= _amount);
        shares[msg.sender] -= _amount;
        shares[_recipient] += _amount;
        emit ShareTransfer(msg.sender, _recipient, _amount);
        return true;
    }

    function withdraw() public payable {
        uint256 revenue = revenues[msg.sender];
        revenues[msg.sender] = 0;
        payable(msg.sender).transfer(revenue);
        emit Withdrawal(msg.sender, revenue);
    }

    // View & Pure Functions
    function isShareholder(address _address)
        public
        view
        returns (bool, uint256)
    {
        for (uint256 i = 0; i < shareholders.length; i++) {
            if (_address == shareholders[i]) {
                return (true, i);
            }
        }
        return (false, 0);
    }

    function showSharesOf(address _address)
        public
        view
        returns (uint256 totalShare)
    {
        return shares[_address];
    }

    function showTax() public view returns (uint256) {
        return tax;
    }

    function showTenant() public view returns (address) {
        return tenant;
    }

    function showRent() public view returns (uint256) {
        return rent;
    }

    function getMainPropertyOwnerAddress() public view returns (address) {
        return mainPropertyOwner;
    }

    function getAuthorityAddress() public view returns (address) {
        return authority;
    }

    // Tenant Function to Try Other Functions
    function payRent(uint8 _months) public payable isTenant isMultipleOf {
        require(rent != 0, "Rent has not been declared yet!");
        uint256 _rentdue = _months * rent;
        require(msg.value == _rentdue);
        uint256 _taxdeduct = (msg.value * tax) / totalSupply;
        totalBalance += (msg.value - _taxdeduct);
        revenues[authority] += _taxdeduct;
    }

    // Fallback
    receive() external payable {
        payable(msg.sender).transfer(msg.value);
    }
}
